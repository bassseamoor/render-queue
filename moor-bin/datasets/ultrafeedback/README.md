# UltraFeedback → MOOR

MOOR training adapter for openbmb/UltraFeedback. The live Bin stores a dataset reference and compact examples; the heavy corpus stays sharded behind the dataset boundary.

Run python scripts/ultrafeedback_to_moor.py --mode full --out <moor-bin>/datasets/ultrafeedback to materialize the full corpus on a local disk/SSD.
