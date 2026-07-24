import logging
from logging.handlers import RotatingFileHandler
from app.core import config


def setup_logging():
    level = logging.getLevelName(config.settings.log_level)
    fmt = "%(asctime)s %(levelname)s %(name)s %(message)s"
    logging.basicConfig(level=level, format=fmt)
    handler = RotatingFileHandler("app.log", maxBytes=10_000_000, backupCount=3)
    handler.setFormatter(logging.Formatter(fmt))
    logging.getLogger().addHandler(handler)


setup_logging()
