#!/usr/bin/env python3
"""Stream openbmb/UltraFeedback into MOOR-native training metadata."""
# Trigger revision: 2026-10-05 Pulse training import
from __future__ import annotations
import argparse, collections, gzip, heapq, json, math, statistics, time
from pathlib import Path
from datasets import load_dataset

DATASET = "openbmb/UltraFeedback"
ASPECTS = ("instruction_following", "truthfulness", "honesty", "helpfulness")
FILES = [
    "evol_instruct.jsonl","false_qa.jsonl","flan.jsonl",
    "sharegpt.jsonl","truthful_qa.jsonl","ultrachat.jsonl",
]

def num(v):
    try:
        x=float(v)
        return x if math.isfinite(x) else None
    except Exception:
        return None

def completion_scores(c):
    ann=c.get("annotations") or {}
    aspect_scores={}
    rationales={}
    for aspect in ASPECTS:
        a=ann.get(aspect) or {}
        rating=num(a.get("Rating"))
        if rating is not None:
            aspect_scores[aspect]=rating
        rationale=a.get("Rationale For Rating") or a.get("Rationale")
        if rationale:
            rationales[aspect]=rationale
    overall=num(c.get("overall_score"))
    if overall is None and aspect_scores:
        overall=sum(aspect_scores.values())/len(aspect_scores)
    return overall,aspect_scores,rationales

def derive(row):
    scored=[]
    for i,c in enumerate(row.get("completions") or []):
        overall,aspects,rationales=completion_scores(c)
        scored.append({
            "index":i,"model":c.get("model"),"principle":c.get("principle"),
            "overall":overall,"aspects":aspects,"rationales":rationales,
            "response":c.get("response") or "",
        })
    usable=[x for x in scored if x["overall"] is not None]
    if usable:
        best=max(usable,key=lambda x:(x["overall"],sum(x["aspects"].values()) if x["aspects"] else 0))
        worst=min(usable,key=lambda x:(x["overall"],sum(x["aspects"].values()) if x["aspects"] else 0))
        margin=best["overall"]-worst["overall"]
    else:
        best=worst=None
        margin=0.0
    return scored,best,worst,margin

def compact_example(row,best,worst,margin):
    return {
        "dataset":DATASET,
        "source":row.get("source"),
        "source_id":row.get("id"),
        "instruction":row.get("instruction"),
        "correct_answers":row.get("correct_answers"),
        "incorrect_answers":row.get("incorrect_answers"),
        "margin":margin,
        "chosen":None if not best else {
            "model":best["model"],"principle":best["principle"],
            "response":best["response"],"overall":best["overall"],
            "aspects":best["aspects"],"rationales":best["rationales"],
        },
        "rejected":None if not worst else {
            "model":worst["model"],"principle":worst["principle"],
            "response":worst["response"],"overall":worst["overall"],
            "aspects":worst["aspects"],"rationales":worst["rationales"],
        },
        "training_semantics":{
            "intent_evidence":"instruction",
            "preference_evidence":"chosen vs rejected by annotation score",
            "critique_evidence":"per-aspect textual rationales",
            "not_moor_logic":True,
            "promotion_rule":"May inform answer quality/routing; does not become verified MOOR implementation logic without MOOR gates.",
        },
    }

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--out",default="moor-bin/datasets/ultrafeedback")
    ap.add_argument("--mode",choices=("summary","full"),default="summary")
    ap.add_argument("--examples",type=int,default=96)
    ap.add_argument("--shard-rows",type=int,default=2000)
    args=ap.parse_args()
    out=Path(args.out)
    out.mkdir(parents=True,exist_ok=True)
    if args.mode=="full":
        (out/"shards").mkdir(exist_ok=True)

    dataset=load_dataset(DATASET,split="train",streaming=True)

    source_counts=collections.Counter()
    model_counts=collections.Counter()
    principle_counts=collections.Counter()
    aspect_hist={a:collections.Counter() for a in ASPECTS}
    aspect_sum=collections.Counter()
    aspect_n=collections.Counter()
    model_score_sum=collections.Counter()
    model_score_n=collections.Counter()
    rows=completions=scored_completions=0
    prompt_chars=[]
    margins=[]
    heap=[]
    serial=0
    shard=None
    shard_idx=shard_rows=0

    def open_shard():
        nonlocal shard,shard_idx,shard_rows
        if shard:
            shard.close()
        p=out/"shards"/f"part-{shard_idx:04d}.jsonl.gz"
        shard=gzip.open(p,"wt",encoding="utf-8")
        shard_idx+=1
        shard_rows=0

    if args.mode=="full":
        open_shard()

    started=time.time()
    for row in dataset:
        rows+=1
        source_counts[row.get("source") or "unknown"]+=1
        instruction=row.get("instruction") or ""
        prompt_chars.append(len(instruction))
        scored,best,worst,margin=derive(row)
        completions+=len(scored)
        margins.append(margin)

        for c in scored:
            if c["model"]:
                model_counts[c["model"]]+=1
            if c["principle"]:
                principle_counts[c["principle"]]+=1
            if c["overall"] is not None:
                scored_completions+=1
                if c["model"]:
                    model_score_sum[c["model"]]+=c["overall"]
                    model_score_n[c["model"]]+=1
            for a,v in c["aspects"].items():
                aspect_hist[a][str(int(v) if float(v).is_integer() else v)]+=1
                aspect_sum[a]+=v
                aspect_n[a]+=1

        if best and worst:
            ex=compact_example(row,best,worst,margin)
            serial+=1
            item=(margin,serial,ex)
            if len(heap)<args.examples:
                heapq.heappush(heap,item)
            elif margin>heap[0][0]:
                heapq.heapreplace(heap,item)

        if args.mode=="full":
            payload={
                "dataset":DATASET,
                "row":row,
                "derived":{
                    "scores":[{k:v for k,v in c.items() if k!="response"} for c in scored],
                    "best_index":None if not best else best["index"],
                    "worst_index":None if not worst else worst["index"],
                    "margin":margin,
                },
            }
            shard.write(json.dumps(payload,ensure_ascii=False)+"\n")
            shard_rows+=1
            if shard_rows>=args.shard_rows:
                open_shard()

        if rows%5000==0:
            print(f"processed {rows:,} rows / {completions:,} completions",flush=True)

    if shard:
        shard.close()

    examples=[x[2] for x in sorted(heap,key=lambda x:(-x[0],x[1]))]
    with (out/"examples.jsonl").open("w",encoding="utf-8") as fh:
        for ex in examples:
            fh.write(json.dumps(ex,ensure_ascii=False)+"\n")

    model_means={m:model_score_sum[m]/model_score_n[m] for m in model_score_n if model_score_n[m]}
    summary={
        "dataset":DATASET,
        "generated_at":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime()),
        "elapsed_seconds":round(time.time()-started,2),
        "rows":rows,
        "completions":completions,
        "scored_completions":scored_completions,
        "source_counts":dict(source_counts.most_common()),
        "model_counts":dict(model_counts.most_common()),
        "principle_counts":dict(principle_counts.most_common()),
        "aspect_rating_histograms":{a:dict(sorted(h.items())) for a,h in aspect_hist.items()},
        "aspect_means":{a:(aspect_sum[a]/aspect_n[a] if aspect_n[a] else None) for a in ASPECTS},
        "model_mean_score":dict(sorted(model_means.items(),key=lambda kv:-kv[1])),
        "prompt_chars":{
            "mean":statistics.mean(prompt_chars) if prompt_chars else 0,
            "median":statistics.median(prompt_chars) if prompt_chars else 0,
            "max":max(prompt_chars) if prompt_chars else 0,
        },
        "preference_margin":{
            "mean":statistics.mean(margins) if margins else 0,
            "median":statistics.median(margins) if margins else 0,
            "max":max(margins) if margins else 0,
        },
        "examples_written":len(examples),
        "mode":args.mode,
    }
    (out/"summary.json").write_text(json.dumps(summary,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")

    manifest={
        "schema":"moor.dataset.training",
        "version":1,
        "id":"dataset:openbmb-ultrafeedback",
        "dataset":DATASET,
        "revision":"main",
        "license":"MIT",
        "upstream":"https://huggingface.co/datasets/openbmb/UltraFeedback",
        "format":"JSONL upstream / MOOR derived preference examples",
        "upstream_files":FILES,
        "mapping":{
            "instruction":"intent/example request",
            "completion.response":"candidate answer",
            "completion.annotations":"critique + score evidence",
            "best_vs_worst":"preference example",
            "correct_answers / incorrect_answers":"reference answer evidence when present",
        },
        "aspects":list(ASPECTS),
        "admission":{
            "rights_review":"MIT dataset license",
            "quality_note":"Upstream annotations are model-generated and can contain mistakes.",
            "logic_boundary":"This dataset trains answer-quality/preference inference. It does not by itself verify MOOR implementation logic.",
            "eval_separation":"Do not silently reuse evaluation rows as claimed MOOR build verification.",
        },
        "summary_file":"summary.json",
        "examples_file":"examples.jsonl",
        "full_local_mode":"python scripts/ultrafeedback_to_moor.py --mode full",
    }
    (out/"manifest.json").write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    (out/"README.md").write_text(
        "# UltraFeedback → MOOR\n\n"
        "MOOR training adapter for openbmb/UltraFeedback. The live Bin stores a dataset reference and compact examples; "
        "the heavy corpus stays sharded behind the dataset boundary.\n\n"
        "Run python scripts/ultrafeedback_to_moor.py --mode full --out <moor-bin>/datasets/ultrafeedback "
        "to materialize the full corpus on a local disk/SSD.\n",
        encoding="utf-8",
    )
    print(json.dumps(summary,indent=2))

if __name__=="__main__":
    main()
