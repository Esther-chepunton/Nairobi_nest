"""Basic tests for ingestion and search pipeline."""

from pipeline.embedder import cosine_similarity, embed_text
from pipeline.normalizer import infer_category, slugify_name
from search.query_parser import parse_query


def test_slugify_name():
    assert slugify_name("Karura Forest", "Nairobi") == "karura-forest-nairobi"


def test_infer_category_waterfall():
    tags = {"natural": "waterfall"}
    assert infer_category(tags, "Chania Falls", "A scenic waterfall", {}) == "waterfall"


def test_embed_similarity():
    a = embed_text("romantic cafe nairobi")
    b = embed_text("romantic coffee shop")
    sim = cosine_similarity(a, b)
    assert sim > 0.1


def test_parse_query_near_nairobi():
    parsed = parse_query("waterfalls near Nairobi", {})
    assert parsed["latitude"] is not None
    assert parsed["category"] == "waterfall" or "waterfalls" in parsed["keywords"]
