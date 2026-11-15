# Augmented Physics: Creating Interactive and Embedded Physics Simulations from Static Textbook Diagrams

## In one line
How to turn the static physics diagrams in a textbook into interactive simulations embedded in the page.

## What they did
Computer vision (Segment Anything) plus a multimodal LLM let teachers semi-automatically extract diagrams from textbook pages and generate simulations from them. The LLM recognises circuit symbols, suggests the type of simulation and fills in parameters. The system is open source (ML pipeline and browser simulator).

## How it is built
- A very dense first paragraph of related work ties a whole field together: on-screen simulators (PhET, oPhysics…) and AR or tangible simulation tools (RealitySketch, Urp, Illuminating Clay…).
- Two more threads: authoring tools, and making static explanations dynamic (Bret Victor's *Explorable Explanations*).
- Section 4, the technical implementation, is exceptionally clear.

## What stays with me
- I like this solid, well-explained kind of paper and would happily write more like it.
- Work like this should be open source.
- Their future direction, bringing intelligent suggestions into workflows such as meetings, active reading and research, is promising, especially for working with machine learning, multimodal AI and multi-agent systems.

> "Although we employ large language models (LLMs) in our pipeline … there is immense unexplored potential."

## Open questions
- Personalised learning is a function HCI cannot ignore. How much of the way we train AI could inspire educational tools that, in turn, strengthen human creativity and learning?
- Can this kind of solid technical work be combined with critical design?
