import argparse
import cv2
import yaml
from pathlib import Path

from logger import EventLogger
from video_pipeline import VideoPipeline


def load_config(path="config.yaml"):
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def parse_source(source):
    # "0" becomes webcam index 0; file paths remain strings.
    try:
        return int(source)
    except ValueError:
        return source


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default=None, help="0 for webcam or path to video")
    parser.add_argument("--config", default="config.yaml")
    args = parser.parse_args()

    config = load_config(args.config)
    source = parse_source(
        args.source if args.source is not None else str(config["video"]["source"])
    )

    Path("outputs").mkdir(exist_ok=True)
    Path("logs").mkdir(exist_ok=True)

    logger = EventLogger(
        json_path=config["logging"]["json_path"],
        csv_path=config["logging"]["csv_path"],
        privacy_config=config["privacy"],
    )

    pipeline = VideoPipeline(config=config, logger=logger)
    pipeline.run(source)


if __name__ == "__main__":
    main()
