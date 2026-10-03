from app.services.gemma_orchestration import build_gemma_prompt


def test_gemma_prompt():
    customer_text = (
        "I need to move my two bedroom flat "
        "from Leeds to Bradford next Friday."
    )

    prompt = build_gemma_prompt(customer_text)

    assert "Leeds" in prompt
    assert "Bradford" in prompt
    assert "next Friday" in prompt
    assert "JSON" in prompt
    