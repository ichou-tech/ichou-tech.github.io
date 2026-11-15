# Generative Agents: Interactive Simulacra of Human Behavior

## In one line
Agents built on a large language model that keep a long-term memory, reflect on it and plan, so that their behaviour stays believable over time and across a whole community of agents.

## What they did
A three-layer architecture: a **memory stream**, **reflection** and **planning**. The agent takes its current environment and past experience as input and produces behaviour as output. Without these mechanisms, an LLM can still act, but it won't build on its past, draw higher-level inferences or stay coherent in the long run.

> "At the center of our architecture is the memory stream, a database that maintains a comprehensive record of an agent's experience."

So the heart of the paper is the memory stream: how to select what matters from a growing record and react to it. They then measure how believable the agents are.

## What I like
The whole experiment: a small town in the spirit of Stardew Valley, which was inventive and playful for its time, and the way the authors move from a game setting to a theoretical contribution. That path from play to theory is useful for thinking about playful interaction mechanisms.

## A critical note
The generative agents inherit the limitations of the underlying LLM.
