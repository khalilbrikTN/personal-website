"""Build the data behind the homepage "Retrieval, Live" hero.

Embeds short statements about my work with all-MiniLM-L6-v2, projects them to
2D with UMAP, and runs real cosine-similarity retrieval for each scripted
question. The scores shown on the site are the genuine top-k scores computed
here. Outputs:

    assets/data/embeddings.json   2D points for the canvas field
    assets/data/hero-scripts.json questions, retrieved hits, answers
    assets/img/field.svg          static fallback of the field (no-JS / reduced motion)
    index.html                    static final state between the TRACE:STATIC markers

Dev-only. Run from the repo root:
    pip install sentence-transformers umap-learn
    python tools/build_embeddings.py
"""

import html
import json
import re
from pathlib import Path

import numpy as np
import umap
from sentence_transformers import SentenceTransformer

ROOT = Path(__file__).resolve().parent.parent
MODEL = "sentence-transformers/all-MiniLM-L6-v2"

# Groups colour the field: 0 = LLM systems, 1 = research & optimisation, 2 = other experience
GROUPS = ["LLM systems", "Research", "Other"]

# What a retrieved hit looks like in the panel, and the sentence the answer uses for it.
REFS = {
    "aico": dict(group=0, href="#xp-aico", title="The AI Company: 3 production AI agents", metric="500+ users · LangChain, ChromaDB, FastAPI",
                 say="co-founded The AI Company and shipped three production AI agents (accounting RAG, CV screening, HR) used by 500+ people"),
    "diaspura": dict(group=0, href="#xp-diaspura", title="diasPÜra: RAG chatbot on AWS", metric="1,000+ users · still live",
                     say="built and deployed a LLaMA RAG chatbot on AWS that still serves 1,000+ users"),
    "emergency": dict(group=0, href="#proj-911", title="Emergency response LLM pipeline", metric="Whisper + LoRA, NER · NCUR 2025",
                      say="built an end-to-end LLM pipeline for 911 calls with a LoRA-fine-tuned Whisper and NER"),
    "clustering": dict(group=0, href="#proj-cluster", title="LLM-assisted feedback clustering", metric="GPT-4 · 2,000+ entries",
                       say="used GPT-4 few-shot clustering on 2,000+ feedback entries, validated with ARI and silhouette"),
    "stack": dict(group=0, href="#skills", title="LLM engineering stack", metric="LangChain · LlamaIndex · LLaMA · LoRA · RAG",
                  say="works with LangChain, LlamaIndex, LLaMA fine-tuning with LoRA, RAG and vector databases"),
    "thesis": dict(group=1, href="#pub-qcnc", title="IEEE QCNC 2026: quantum AP selection", metric="first author · −90.4% features",
                   say="is first author of an IEEE QCNC paper that cut WiFi localisation features by 90.4% with QUBO optimisation on D-Wave"),
    "orbital": dict(group=1, href="#pub-icghit", title="IEEE ICGHIT 2026: Orbital Intelligence", metric="sustainable LLM training",
                    say="published an IEEE ICGHIT paper on sustainable LLM training and inference in orbit"),
    "fairness": dict(group=1, href="#proj-fair", title="Fairness-aware healthcare ML", metric="NIH All of Us · +17% bias quantification",
                     say="measured algorithmic bias in healthcare models on the NIH All of Us dataset"),
    "msc": dict(group=1, href="#education", title="Education: Erasmus Mundus M.Sc. · AUC B.Sc.", metric="Advanced ML & optimisation · GPA 3.7",
                say="is doing an Erasmus Mundus M.Sc. in advanced ML and optimisation in Genova and Compiègne"),
    "ey": dict(group=2, href="#xp-ey", title="EY: ML & data engineering", metric="$500K investment informed",
               say="built an ML vendor-recommendation system at EY that informed a $500K AI platform investment"),
    "adib": dict(group=2, href="#xp-adib", title="ADIB: NLP for security", metric="5,000+ users · +60% IAM efficiency",
                 say="built NLP data-leakage detection for 5,000+ users at ADIB bank"),
    "about": dict(group=2, href="#contact", title="Based in Genova, Italy (CET)", metric="remote · available now",
                  say="is based in Genova, Italy (CET), open to fully remote work and available immediately"),
    "languages": dict(group=2, href="#contact", title="Languages", metric="English C1 · French B2 · Arabic native",
                      say="works in English (C1) and French (B2) and speaks Arabic natively"),
}

# Statements about my work, all taken from my CV.
CORPUS = [
    ("aico", "Co-founder and AI engineer at The AI Company, an AI startup."),
    ("aico", "Built and deployed three production AI agents for Egyptian SMEs."),
    ("aico", "The agents use LangChain, LLaMA, ChromaDB and FastAPI, containerised with Docker and served via REST APIs."),
    ("aico", "The AI agents reached more than 500 end users across client organisations."),
    ("aico", "Accounting document agent: a RAG pipeline over chunked invoices, ledgers and bank statements indexed in ChromaDB."),
    ("aico", "Custom named entity recognition extracts structured fields from financial documents."),
    ("aico", "Reduced manual reconciliation time by 70% while processing over 1,000 documents a month."),
    ("aico", "Job application review agent matches CVs against job descriptions with sentence-transformer embeddings and cosine similarity."),
    ("aico", "LLM-powered shortlisting with bias-aware scoring cut screening time by 65% across 300+ applications per hiring cycle."),
    ("aico", "HR management agent: multi-turn conversational RAG over company policy documents."),
    ("aico", "The HR agent uses tool calling for leave and onboarding workflows and escalates to a human below a confidence threshold."),
    ("aico", "Reduced HR response time by 50% with an AI agent."),
    ("aico", "Shipped LLM agents to production for real businesses with real users."),
    ("diaspura", "NLP engineering intern at diasPÜra, an immigration tech startup in France."),
    ("diaspura", "Designed, built and deployed a production RAG chatbot on AWS using LLaMA."),
    ("diaspura", "The chatbot retrieves from scraped government immigration sources and serves over 1,000 active users."),
    ("diaspura", "The RAG system is still live in production."),
    ("diaspura", "Improved answer accuracy by 20% with an automated web scraping pipeline into a vector-indexed knowledge base."),
    ("diaspura", "Built multi-turn conversation flows with backend API integrations for legal and documentation topics."),
    ("diaspura", "Worked remotely with a globally distributed team."),
    ("emergency", "Built an end-to-end LLM pipeline to classify emergency 911 calls."),
    ("emergency", "Fine-tuned Whisper speech recognition with LoRA on the 911 call domain."),
    ("emergency", "Named entity recognition extracted addresses with 76.5% field-level accuracy from 518 calls."),
    ("emergency", "Used GPT-4 to classify emergency type and support human dispatchers."),
    ("emergency", "Voice-based sentiment analysis detects caller stress in real time; dispatch efficiency improved by 25%."),
    ("emergency", "Presented the emergency response LLM research at NCUR 2025 in Pittsburgh."),
    ("clustering", "Built a GPT-4 few-shot semantic clustering framework for 2,000+ student feedback entries."),
    ("clustering", "Improved peer assessment coherence by 28% with LLM-assisted clustering."),
    ("clustering", "Validated GPT-human clustering agreement with ARI and silhouette scores."),
    ("clustering", "Proposed a transformer embedding-based recommender for adaptive assessment."),
    ("stack", "LLM engineering with LangChain, LlamaIndex and the OpenAI API."),
    ("stack", "LLaMA inference and fine-tuning with LoRA and PEFT using Hugging Face Transformers."),
    ("stack", "RAG architectures, embedding pipelines, retrieval evaluation, tool calling and multi-agent systems."),
    ("stack", "Vector databases: ChromaDB and FAISS for semantic search."),
    ("stack", "Machine learning with PyTorch, TensorFlow and scikit-learn."),
    ("stack", "Backend and deployment with Python, FastAPI, Django, Flask, Docker and AWS."),
    ("stack", "Data work with SQL, Pandas, NumPy and ETL pipelines."),
    ("thesis", "Bachelor's thesis on quantum-classical hybrid optimisation, accepted at IEEE QCNC 2026."),
    ("thesis", "First author of an IEEE paper on quantum optimisation for access point selection under a budget constraint."),
    ("thesis", "Formulated WiFi access point selection as a QUBO problem for indoor localisation."),
    ("thesis", "Processed 520 access points across 19,937 fingerprints spanning 5 floors and 3 buildings."),
    ("thesis", "Achieved a 90.4% feature space reduction while maintaining positioning accuracy."),
    ("thesis", "Benchmarked D-Wave quantum annealing hardware against classical algorithms."),
    ("thesis", "Quantum computing with QUBO, QAOA, Qiskit and D-Wave."),
    ("orbital", "Paper accepted at IEEE ICGHIT 2026: Orbital Intelligence."),
    ("orbital", "Proposes training and running large language models aboard orbital platforms for sustainability."),
    ("orbital", "Explores solar power and passive cooling in space to cut the energy footprint of LLMs."),
    ("fairness", "Fairness-aware healthcare machine learning at the College of Charleston data mining lab."),
    ("fairness", "Detected algorithmic bias across demographic groups on the NIH All of Us dataset."),
    ("fairness", "Designed custom fairness metrics, improving bias quantification by 17%."),
    ("fairness", "Regularised deep learning showed 15% higher fairness consistency than classical models."),
    ("msc", "M.Sc. in Computer Engineering, Erasmus Mundus EMSSE, University of Genova and UTC Compiègne."),
    ("msc", "Specialising in advanced machine learning and optimisation of systems."),
    ("msc", "B.Sc. in Computer Science from the American University in Cairo, GPA 3.7, Dean's List every semester."),
    ("msc", "Semester at the College of Charleston studying advanced ML, LLMs and computer vision, GPA 3.9."),
    ("msc", "Tomorrow's Leaders scholar of the U.S. Department of State."),
    ("ey", "ML and data engineering intern at Ernst & Young's technology practice in Tunis."),
    ("ey", "Built an ML vendor recommendation system with SQL and predictive modelling that informed a $500K AI platform investment."),
    ("ey", "Python market analysis for a financial services client found 3 growth opportunities worth over $1M."),
    ("ey", "Technical due diligence on an M&A deal: system architecture, data infrastructure and technical debt."),
    ("adib", "AI and information security engineering intern at Abu Dhabi Islamic Bank in Cairo."),
    ("adib", "NLP data leakage detection with TF-IDF and SVM monitoring email for 5,000+ users."),
    ("adib", "Django automation for identity access management: 60% more efficient, 40% fewer errors."),
    ("adib", "Scraping pipeline aggregating 700,000 malicious IP addresses from threat intelligence feeds."),
    ("about", "Based in Genova, Italy, in the CET time zone."),
    ("about", "Open to fully remote work."),
    ("about", "Available to start immediately."),
    ("about", "Works remotely across time zones."),
    ("languages", "Speaks English at C1 level and French at B2 level."),
    ("languages", "Native Arabic speaker, learning German and Italian."),
]

SCRIPTS = [
    dict(id="why-hire", chip="Why hire Khalil?", q="Why hire Khalil as an AI engineer? Production LLM agents and RAG systems with real users"),
    dict(id="production", chip="Production experience?", q="Has Khalil deployed LLM and RAG systems to production for real users?"),
    dict(id="research", chip="Research?", q="Research publications: accepted IEEE conference papers"),
    dict(id="remote", chip="Remote work?", q="Can Khalil work remotely? Location, time zone and availability"),
    dict(id="stack", chip="Tech stack?", q="Which LLM frameworks and tools does Khalil use?"),
]
TOP_K = 3


def unit(v):
    return v / np.linalg.norm(v, axis=-1, keepdims=True)


def build_answer(hit_refs):
    parts = [f"{REFS[ref]['say']} [{i}]" for i, ref in enumerate(hit_refs, 1)]
    return "Khalil " + "; ".join(parts[:-1]) + f"; and {parts[-1]}."


def answer_html(answer, hits):
    def cite(m):
        n = int(m.group(1))
        return f'<a class="cite" href="{hits[n - 1]["href"]}">[{n}]</a>'
    return re.sub(r"\[(\d)\]", cite, html.escape(answer))


def main():
    refs = [r for r, _ in CORPUS]
    texts = [t for _, t in CORPUS]
    model = SentenceTransformer(MODEL)
    emb = unit(model.encode(texts, convert_to_numpy=True))

    reducer = umap.UMAP(n_neighbors=12, min_dist=0.15, metric="cosine", random_state=42)
    xy = reducer.fit_transform(emb)
    lo, hi = xy.min(0), xy.max(0)

    def norm(p):
        return np.clip(0.06 + 0.88 * (p - lo) / (hi - lo), 0.03, 0.97)

    pts = norm(xy)
    ref_ids = list(REFS)

    scripts_out = []
    for sc in SCRIPTS:
        qv = unit(model.encode([sc["q"]], convert_to_numpy=True))[0]
        cos = emb @ qv
        best = {}
        for idx, (ref, c) in enumerate(zip(refs, cos)):
            if ref not in best or c > cos[best[ref]]:
                best[ref] = idx
        ranked = sorted(best, key=lambda r: -cos[best[r]])[:TOP_K]
        hits = [dict(ref=r, score=round(float(cos[best[r]]), 2), point=int(best[r]),
                     title=REFS[r]["title"], metric=REFS[r]["metric"], href=REFS[r]["href"]) for r in ranked]
        qp = norm(reducer.transform(qv[None, :])[0])
        answer = build_answer(ranked)
        scripts_out.append(dict(id=sc["id"], chip=sc["chip"], q=sc["q"],
                                queryPoint=[round(float(qp[0]), 3), round(float(qp[1]), 3)],
                                hits=hits, answer=answer))
        print(f"\n[{sc['id']}] {sc['q']}")
        for h in hits:
            print(f"   {h['score']:.2f}  {h['ref']:10}  {texts[h['point']]}")

    data_dir = ROOT / "assets" / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    (data_dir / "embeddings.json").write_text(json.dumps({
        "model": MODEL, "dims": int(emb.shape[1]), "groups": GROUPS, "refs": ref_ids,
        "points": [[round(float(x), 3), round(float(y), 3), REFS[r]["group"], ref_ids.index(r)] for (x, y), r in zip(pts, refs)],
    }, separators=(",", ":")), encoding="utf-8")
    (data_dir / "hero-scripts.json").write_text(json.dumps({"k": TOP_K, "scripts": scripts_out}, ensure_ascii=False, indent=1), encoding="utf-8")

    # Static SVG field (fallback when the canvas does not run)
    colors = ["#22d3ee", "#818cf8", "#64748b"]
    W, H = 400, 210
    first = scripts_out[0]
    circles = "".join(f'<circle cx="{x * W:.1f}" cy="{y * H:.1f}" r="2.2" fill="{colors[g]}" opacity="0.75"/>'
                      for x, y, g, _ in [[*p, REFS[r]["group"], 0] for p, r in zip(pts, refs)])
    qx, qy = first["queryPoint"][0] * W, first["queryPoint"][1] * H
    edges = "".join(f'<line x1="{qx:.1f}" y1="{qy:.1f}" x2="{pts[h["point"]][0] * W:.1f}" y2="{pts[h["point"]][1] * H:.1f}" stroke="#22d3ee" stroke-width="1" opacity="0.7"/>'
                    for h in first["hits"])
    flares = "".join(f'<circle cx="{pts[h["point"]][0] * W:.1f}" cy="{pts[h["point"]][1] * H:.1f}" r="4.5" fill="#22d3ee"/>' for h in first["hits"])
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="none">{circles}{edges}{flares}'
           f'<rect x="{qx - 4:.1f}" y="{qy - 4:.1f}" width="8" height="8" fill="#fcd34d" transform="rotate(45 {qx:.1f} {qy:.1f})"/></svg>')
    (ROOT / "assets" / "img" / "field.svg").write_text(svg, encoding="utf-8")

    # Static final state in index.html (what no-JS and reduced-motion visitors see)
    hits_html = "\n".join(
        f'                        <li><a class="tp-hit" href="{h["href"]}"><span class="tp-n">[{i}]</span>'
        f'<span class="tp-score">{h["score"]:.2f}</span><span class="tp-hit-title">{html.escape(h["title"])}</span>'
        f'<span class="tp-metric">{html.escape(h["metric"])}</span></a></li>'
        for i, h in enumerate(first["hits"], 1))
    chips_html = "\n".join(
        f'                        <button type="button" class="tp-chip" data-script="{s["id"]}" aria-pressed="{str(s is first).lower()}">{html.escape(s["chip"])}</button>'
        for s in scripts_out)
    legend = "".join(f'<span><i style="background:{c}"></i>{g}</span>' for c, g in zip(colors, GROUPS))
    static = f"""<!-- TRACE:STATIC START -->
                    <div class="tp-query"><span class="tp-prompt" aria-hidden="true">&gt;</span><span id="tp-q">{html.escape(first["q"])}</span><span class="tp-caret" aria-hidden="true"></span></div>
                    <div class="tp-field" style="background-image:url('assets/img/field.svg')">
                        <canvas id="tp-canvas" aria-hidden="true"></canvas>
                        <p class="tp-legend" aria-hidden="true">{legend}</p>
                    </div>
                    <ol class="tp-steps" aria-hidden="true">
                        <li class="is-done" data-step="embed">embed <span>{emb.shape[1]}-d</span></li>
                        <li class="is-done" data-step="retrieve">retrieve <span>k={TOP_K}</span></li>
                        <li class="is-done" data-step="generate">generate</li>
                    </ol>
                    <ol class="tp-hits" id="tp-hits" aria-label="Retrieved evidence">
{hits_html}
                    </ol>
                    <p class="tp-answer" id="tp-answer">{answer_html(first["answer"], first["hits"])}</p>
                    <div class="tp-chips" id="tp-chips" aria-label="Ask another question">
{chips_html}
                    </div>
<!-- TRACE:STATIC END -->"""
    index = ROOT / "index.html"
    page = index.read_text(encoding="utf-8")
    page = re.sub(r"<!-- TRACE:STATIC START -->.*?<!-- TRACE:STATIC END -->", lambda _: static, page, flags=re.S)
    index.write_text(page, encoding="utf-8", newline="")
    print(f"\nwrote {len(texts)} points, {len(scripts_out)} scripts")


if __name__ == "__main__":
    main()
