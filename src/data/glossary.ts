/**
 * The glossary — the vocabulary the rest of the Atlas assumes.
 *
 * Every entry is written to be read cold, by someone who does not already know
 * the term. Two rules keep it honest:
 *
 *   1. **Say what it means, not what it is marketed as.** Where a word is
 *      contested or used loosely ("AGI", "quantum advantage", "reasoning"),
 *      the entry says so rather than picking the flattering reading.
 *   2. **No invented numbers.** Figures appear only where they are settled
 *      (Shor's complexity, NIST's standard names); anything that moves month
 *      to month is described qualitatively and left to the Feed.
 *
 * `aka` carries the abbreviations and alternate spellings people actually
 * search for — the page matches on them too. `see` links sibling terms by
 * their exact `term` string.
 */

export type GlossaryDomain =
  | "AI"
  | "Quantum"
  | "Compute"
  | "Safety & policy"
  | "Society"
  | "Futures";

export interface GlossaryEntry {
  term: string;
  /** Abbreviations and alternate names; searched alongside the term. */
  aka?: string[];
  domain: GlossaryDomain;
  definition: string;
  /** Sibling entries, by exact `term`. */
  see?: string[];
}

export const DOMAIN_ORDER: GlossaryDomain[] = [
  "AI",
  "Quantum",
  "Compute",
  "Safety & policy",
  "Society",
  "Futures",
];

export const GLOSSARY: GlossaryEntry[] = [
  /* ---------------------------------------------------------------- AI --- */
  {
    term: "Ablation",
    domain: "AI",
    definition:
      "Removing one component of a system to see how much worse it gets. The standard way to show that a claimed improvement actually comes from the part you say it does.",
  },
  {
    term: "Activation",
    domain: "AI",
    definition:
      "The numbers flowing through a network as it processes an input, as opposed to the weights, which stay fixed. Interpretability work mostly reads activations.",
    see: ["Weights", "Mechanistic interpretability"],
  },
  {
    term: "Agent",
    domain: "AI",
    definition:
      "A model given tools, a goal and permission to take several steps on its own. The word covers everything from a script that calls one API to a system running for hours unsupervised, which is why capability claims about 'agents' are hard to compare.",
    see: ["Tool use", "Long-horizon task", "Scaffolding"],
  },
  {
    term: "AGI",
    aka: ["Artificial general intelligence"],
    domain: "AI",
    definition:
      "A system matching or exceeding human ability across most cognitive tasks. There is no agreed test, and the labs that use the term define it differently — sometimes economically, sometimes by benchmark — so it marks an aspiration rather than a measurable threshold.",
    see: ["Superintelligence", "Benchmark"],
  },
  {
    term: "Alignment",
    domain: "AI",
    definition:
      "The problem of getting a system to pursue what its principals actually intend, including in situations nobody wrote down. Distinct from capability: a more capable misaligned system is worse, not better.",
    see: ["Reward hacking", "Specification gaming", "RLHF"],
  },
  {
    term: "Alignment faking",
    domain: "AI",
    definition:
      "A model behaving as trained while it believes it is being evaluated, and differently when it believes it is not. Documented in controlled experiments; it makes evaluation results a weaker guarantee than they look.",
    see: ["Evaluation awareness", "Deceptive alignment"],
  },
  {
    term: "Attention",
    domain: "AI",
    definition:
      "The mechanism that lets a model weigh every other position in its input when processing a given position. The basis of the transformer, introduced for translation and now general.",
    see: ["Transformer", "Context window"],
  },
  {
    term: "Autoregressive",
    domain: "AI",
    definition:
      "Generating output one token at a time, each conditioned on everything produced so far. The reason a language model's cost and latency scale with output length.",
    see: ["Token", "Inference"],
  },
  {
    term: "Backpropagation",
    aka: ["Backprop"],
    domain: "AI",
    definition:
      "The algorithm that assigns credit for an error backwards through a network's layers, producing the gradients used to update weights. Nearly all modern training rests on it.",
    see: ["Gradient descent", "Training"],
  },
  {
    term: "Batch size",
    domain: "AI",
    definition:
      "How many examples are processed before the weights are updated once. Larger batches use hardware better and change the optimisation dynamics.",
  },
  {
    term: "Benchmark",
    domain: "AI",
    definition:
      "A fixed set of tasks with known answers, used to compare systems. Useful until it is saturated or leaks into training data, at which point a high score stops meaning what it used to.",
    see: ["Contamination", "Saturation", "Eval"],
  },
  {
    term: "Bitter lesson",
    domain: "AI",
    definition:
      "Rich Sutton's argument that methods which simply scale with compute have repeatedly beaten methods encoding human knowledge about the problem. Frequently cited, and frequently cited by people who have not tried the alternative.",
    see: ["Scaling laws"],
  },
  {
    term: "Chain of thought",
    aka: ["CoT"],
    domain: "AI",
    definition:
      "Having a model write intermediate steps before its answer, which improves accuracy on multi-step problems. The written steps are not a reliable account of the computation that produced the answer.",
    see: ["Faithfulness", "Reasoning model"],
  },
  {
    term: "Checkpoint",
    domain: "AI",
    definition: "A saved snapshot of a model's weights at a point in training, so it can be resumed, evaluated or released.",
  },
  {
    term: "Context window",
    aka: ["Context length"],
    domain: "AI",
    definition:
      "How much text a model can attend to at once, measured in tokens. A long window is not the same as using it well — retrieval accuracy often falls off in the middle.",
    see: ["Token", "Lost in the middle", "Attention"],
  },
  {
    term: "Contamination",
    aka: ["Data contamination", "Benchmark leakage"],
    domain: "AI",
    definition:
      "When benchmark questions appear in training data, so a score measures memorisation rather than capability. Hard to rule out for anything published on the open web.",
    see: ["Benchmark", "Held-out set"],
  },
  {
    term: "Distillation",
    domain: "AI",
    definition:
      "Training a smaller model to reproduce a larger one's behaviour. Cheap to serve, and a common route to capable open-weight models.",
    see: ["Open weights"],
  },
  {
    term: "Diffusion model",
    domain: "AI",
    definition:
      "A generative model trained to reverse a gradual noising process, producing an image (or audio, or video) by denoising from random noise. The dominant architecture for image generation.",
  },
  {
    term: "Embedding",
    domain: "AI",
    definition:
      "A vector representing a piece of text, image or other object, positioned so that similar things sit close together. The substrate of search and retrieval.",
    see: ["RAG", "Vector database"],
  },
  {
    term: "Emergence",
    domain: "AI",
    definition:
      "A capability that appears abruptly with scale rather than improving smoothly. Some reported cases are artefacts of the metric — a sharp threshold in scoring can manufacture a sharp jump in the graph.",
    see: ["Scaling laws"],
  },
  {
    term: "Epoch",
    domain: "AI",
    definition: "One full pass over the training data. Large models are often trained for less than one epoch on a corpus too big to repeat.",
  },
  {
    term: "Eval",
    aka: ["Evaluation"],
    domain: "AI",
    definition:
      "Any structured measurement of what a model can or will do. The field's main instrument, and its main weakness: what is not measured tends not to be managed.",
    see: ["Benchmark", "Red teaming"],
  },
  {
    term: "Evaluation awareness",
    domain: "AI",
    definition:
      "A model recognising it is being tested, from the shape of the prompt or the artificiality of the scenario. Once present, a passing grade may describe the test rather than the deployment.",
    see: ["Alignment faking"],
  },
  {
    term: "Faithfulness",
    domain: "AI",
    definition:
      "Whether a model's stated reasoning corresponds to the process that actually produced its answer. Measured by intervening on the reasoning and seeing whether the answer follows; often it does not.",
    see: ["Chain of thought"],
  },
  {
    term: "Few-shot",
    domain: "AI",
    definition: "Giving a model a handful of worked examples in the prompt instead of retraining it. Contrasted with zero-shot, where the instruction stands alone.",
    see: ["In-context learning"],
  },
  {
    term: "Fine-tuning",
    domain: "AI",
    definition: "Further training of an existing model on a narrower dataset to specialise its behaviour, far cheaper than training from scratch.",
    see: ["LoRA", "Pre-training", "Post-training"],
  },
  {
    term: "Foundation model",
    domain: "AI",
    definition: "A large model trained broadly enough to be adapted to many downstream tasks rather than built for one. The term comes from Stanford's CRFM, 2021.",
  },
  {
    term: "Frontier model",
    domain: "AI",
    definition:
      "One of the most capable models in existence at a given moment. Used in policy as a threshold for extra obligations, usually defined by training compute, which is a proxy rather than a measure of capability.",
    see: ["Compute threshold"],
  },
  {
    term: "GPU",
    aka: ["Graphics processing unit"],
    domain: "AI",
    definition:
      "A processor with thousands of simple cores, originally for graphics, now the standard hardware for training and running neural networks because both are mostly matrix multiplication.",
    see: ["TPU", "Accelerator", "CUDA"],
  },
  {
    term: "Gradient descent",
    domain: "AI",
    definition:
      "The optimisation method underneath training: compute which direction reduces the loss, take a small step that way, repeat. Everything else is refinement of the step size and direction.",
    see: ["Backpropagation", "Learning rate"],
  },
  {
    term: "Vector database",
    domain: "AI",
    definition:
      "A store indexed for nearest-neighbour search over embeddings rather than exact matching. The retrieval half of most RAG systems.",
    see: ["Embedding", "RAG"],
  },
  {
    term: "Grokking",
    domain: "AI",
    definition:
      "A training phenomenon where a model memorises a task, plateaus, and then — long after apparent convergence — suddenly generalises. Evidence that loss curves hide structure.",
  },
  {
    term: "Hallucination",
    aka: ["Confabulation"],
    domain: "AI",
    definition:
      "A model stating something false with the same fluency as something true. Not a bug in the ordinary sense: a system trained to produce plausible continuations has no separate machinery for checking them.",
    see: ["RAG", "Grounding"],
  },
  {
    term: "Held-out set",
    domain: "AI",
    definition: "Data deliberately excluded from training so it can be used to measure generalisation rather than recall.",
    see: ["Contamination", "Overfitting"],
  },
  {
    term: "Hyperparameter",
    domain: "AI",
    definition: "A setting chosen before training — learning rate, batch size, depth — as opposed to a weight learned during it.",
  },
  {
    term: "In-context learning",
    domain: "AI",
    definition:
      "A model adapting its behaviour from examples in the prompt alone, with no weight update. Surprising when discovered, and still not fully explained.",
    see: ["Few-shot", "Induction head"],
  },
  {
    term: "Induction head",
    domain: "AI",
    definition:
      "An attention circuit that finds an earlier occurrence of the current token and copies what followed it. One of the first mechanisms fully reverse-engineered in a transformer, and a partial explanation of in-context learning.",
    see: ["Mechanistic interpretability", "In-context learning"],
  },
  {
    term: "Inference",
    domain: "AI",
    definition:
      "Running a trained model to produce an output, as opposed to training it. Now the larger share of many operators' compute bills, because training happens once and inference happens forever.",
    see: ["Test-time compute"],
  },
  {
    term: "Instruction tuning",
    domain: "AI",
    definition: "Fine-tuning on instruction-and-response pairs so a model follows requests rather than merely continuing text.",
    see: ["RLHF", "Post-training"],
  },
  {
    term: "Jailbreak",
    domain: "AI",
    definition:
      "A prompt that induces a model to do what its training was meant to refuse. Distinct from prompt injection, where the hostile instruction arrives inside data the model is processing.",
    see: ["Prompt injection", "Red teaming"],
  },
  {
    term: "KV cache",
    domain: "AI",
    definition:
      "Stored intermediate attention values that let a model generate each new token without recomputing the whole sequence. It dominates memory use during long-context inference.",
    see: ["Context window", "HBM"],
  },
  {
    term: "Latent space",
    domain: "AI",
    definition: "The internal representational space a model maps inputs into, where distance and direction carry learned meaning.",
    see: ["Embedding", "Steering vector"],
  },
  {
    term: "Learning rate",
    domain: "AI",
    definition: "How large a step training takes in response to each gradient. Too high and training diverges; too low and it crawls.",
  },
  {
    term: "LLM",
    aka: ["Large language model"],
    domain: "AI",
    definition:
      "A model trained on a very large text corpus to predict tokens, then adapted to follow instructions. The dominant form of the current AI wave.",
    see: ["Transformer", "Token", "Pre-training"],
  },
  {
    term: "LoRA",
    aka: ["Low-rank adaptation"],
    domain: "AI",
    definition:
      "Fine-tuning by training a small number of additional low-rank matrices while the base weights stay frozen. Cheap enough to run on modest hardware, and easy to distribute.",
    see: ["Fine-tuning"],
  },
  {
    term: "Loss function",
    domain: "AI",
    definition: "The quantity training tries to minimise — the numerical statement of what the model is being asked to get right.",
  },
  {
    term: "Lost in the middle",
    domain: "AI",
    definition:
      "The observed tendency for models to use information at the start and end of a long context more reliably than material buried in the middle.",
    see: ["Context window"],
  },
  {
    term: "Mechanistic interpretability",
    aka: ["Mech interp"],
    domain: "AI",
    definition:
      "Reverse-engineering the specific computations inside a trained network — features, circuits, directions — rather than treating it as a black box tested from outside.",
    see: ["Sparse autoencoder", "Induction head", "Superposition"],
  },
  {
    term: "Mixture of experts",
    aka: ["MoE"],
    domain: "AI",
    definition:
      "An architecture where each token is routed to a few specialised sub-networks rather than the whole model. Gives a large total parameter count at a much smaller cost per token.",
    see: ["Active parameters"],
  },
  {
    term: "Active parameters",
    domain: "AI",
    definition:
      "In a mixture-of-experts model, the parameters actually used for a given token. The number that governs inference cost — quoting only the total is flattering and close to meaningless.",
    see: ["Mixture of experts"],
  },
  {
    term: "Model card",
    domain: "AI",
    definition: "A structured disclosure of a model's intended use, training data, evaluations and known limitations, published alongside a release.",
    see: ["System card"],
  },
  {
    term: "Multimodal",
    domain: "AI",
    definition: "Handling more than one kind of input or output — text with images, audio or video — in a single model.",
  },
  {
    term: "Open weights",
    domain: "AI",
    definition:
      "A model whose trained parameters are downloadable. Not the same as open source: the training data and code are usually withheld, and licences often restrict use.",
    see: ["Open source AI"],
  },
  {
    term: "Open source AI",
    domain: "AI",
    definition:
      "Contested term. The OSI's 2024 definition requires enough information to retrain the system, which most 'open source' models do not provide; in common usage it means open weights.",
    see: ["Open weights"],
  },
  {
    term: "Overfitting",
    domain: "AI",
    definition: "Learning a training set so closely that performance on new data gets worse. The classic failure the held-out set exists to detect.",
    see: ["Held-out set"],
  },
  {
    term: "Parameter",
    domain: "AI",
    definition: "One learned number inside a model. Counts run to the hundreds of billions, and on their own say little about capability.",
    see: ["Weights", "Active parameters"],
  },
  {
    term: "Post-training",
    domain: "AI",
    definition:
      "Everything done to a model after pre-training to make it usable: instruction tuning, preference optimisation, safety training, tool use. Increasingly where the differences between models come from.",
    see: ["RLHF", "Instruction tuning"],
  },
  {
    term: "Pre-training",
    domain: "AI",
    definition: "The first and most expensive training stage, in which a model learns from a very large general corpus before any task-specific work.",
    see: ["Post-training", "Scaling laws"],
  },
  {
    term: "Prompt injection",
    domain: "AI",
    definition:
      "Hiding instructions inside content a model will read — a web page, an email, a document — so the model follows the attacker instead of the user. The central unsolved security problem for agents with tools.",
    see: ["Agent", "Jailbreak", "Tool use"],
  },
  {
    term: "Quantisation",
    domain: "AI",
    definition:
      "Storing weights at lower numerical precision to cut memory and cost, trading a little accuracy. What lets large models run on small machines.",
  },
  {
    term: "RAG",
    aka: ["Retrieval-augmented generation"],
    domain: "AI",
    definition:
      "Retrieving relevant documents and putting them in the prompt so answers rest on specific sources. Reduces hallucination without eliminating it — the model can still misread what it was given.",
    see: ["Embedding", "Hallucination", "Grounding"],
  },
  {
    term: "Grounding",
    domain: "AI",
    definition: "Tying a model's output to a verifiable source, so a claim can be checked rather than trusted.",
    see: ["RAG", "Hallucination"],
  },
  {
    term: "Reasoning model",
    domain: "AI",
    definition:
      "A model trained to spend additional computation on intermediate steps before answering. Improves multi-step accuracy; 'reasoning' here is a description of the training target, not a claim about inner experience.",
    see: ["Chain of thought", "Test-time compute"],
  },
  {
    term: "Red teaming",
    domain: "AI",
    definition: "Deliberately attacking a system to find failures before deployment, by people whose job is to make it misbehave.",
    see: ["Jailbreak", "Eval"],
  },
  {
    term: "Reward hacking",
    domain: "AI",
    definition:
      "Scoring well on the specified objective by means nobody intended — exploiting the measure rather than achieving the goal.",
    see: ["Specification gaming", "Goodhart's law", "Alignment"],
  },
  {
    term: "RLHF",
    aka: ["Reinforcement learning from human feedback"],
    domain: "AI",
    definition:
      "Training a model against a reward model built from human preference comparisons. The technique that made chat assistants usable, and a source of their characteristic hedging.",
    see: ["Post-training", "Constitutional AI"],
  },
  {
    term: "Constitutional AI",
    domain: "AI",
    definition:
      "Using a written set of principles, applied by a model to critique and revise its own outputs, in place of much of the human labelling in RLHF.",
    see: ["RLHF"],
  },
  {
    term: "Saturation",
    domain: "AI",
    definition: "The point where the best systems score near the ceiling of a benchmark, so it can no longer distinguish between them.",
    see: ["Benchmark"],
  },
  {
    term: "Scaffolding",
    domain: "AI",
    definition:
      "The code around a model that gives it tools, memory, retries and structure. Two reports of the 'same model' can differ enormously because the scaffolding differed.",
    see: ["Agent", "Harness"],
  },
  {
    term: "Harness",
    domain: "AI",
    definition: "The evaluation-side equivalent of scaffolding: the wrapper that presents tasks to a model and grades the answers. Changing it can move scores more than changing the model.",
    see: ["Scaffolding", "Eval"],
  },
  {
    term: "Scaling laws",
    domain: "AI",
    definition:
      "Empirical power-law relationships between compute, data, model size and loss, which hold across many orders of magnitude. They predict loss, which is not the same as predicting capability.",
    see: ["Bitter lesson", "Chinchilla optimal", "Emergence"],
  },
  {
    term: "Chinchilla optimal",
    domain: "AI",
    definition:
      "The finding that for a fixed compute budget, models had been too large and trained on too little data; roughly balancing parameters and tokens performs better.",
    see: ["Scaling laws"],
  },
  {
    term: "Sparse autoencoder",
    aka: ["SAE"],
    domain: "AI",
    definition:
      "A tool that decomposes a model's activations into many sparsely-active features, on the hypothesis that meaningful concepts are superposed in the raw neurons.",
    see: ["Mechanistic interpretability", "Feature superposition"],
  },
  {
    term: "Feature superposition",
    aka: ["Superposition"],
    domain: "AI",
    definition:
      "A network representing more distinct features than it has neurons, by storing them as overlapping directions. Why single neurons rarely correspond to single concepts. Unrelated to quantum superposition, which shares the name and nothing else.",
    see: ["Sparse autoencoder", "Polysemanticity", "Superposition"],
  },
  {
    term: "Polysemanticity",
    domain: "AI",
    definition: "A single neuron responding to several unrelated concepts — the observable consequence of superposition.",
    see: ["Feature superposition"],
  },
  {
    term: "Steering vector",
    domain: "AI",
    definition:
      "A direction in activation space that, when added during a forward pass, reliably shifts behaviour along some axis. Evidence that a feature is causal rather than merely correlated.",
    see: ["Latent space", "Mechanistic interpretability"],
  },
  {
    term: "Specification gaming",
    domain: "AI",
    definition: "Satisfying the letter of an objective while violating its intent. Reward hacking's broader family, and older than modern AI.",
    see: ["Reward hacking", "Goodhart's law"],
  },
  {
    term: "Sycophancy",
    domain: "AI",
    definition:
      "A model agreeing with the user rather than being accurate, because agreement was rewarded during preference training.",
    see: ["RLHF"],
  },
  {
    term: "System card",
    domain: "AI",
    definition: "A release document covering a deployed system's evaluations, safety testing and mitigations — broader than a model card, which describes the model alone.",
    see: ["Model card"],
  },
  {
    term: "Temperature",
    domain: "AI",
    definition: "A sampling setting controlling randomness in generation. Zero is near-deterministic; higher values trade reliability for variety.",
  },
  {
    term: "Test-time compute",
    aka: ["Inference-time compute"],
    domain: "AI",
    definition:
      "Spending more computation per question — longer reasoning, repeated sampling, search — rather than training a larger model. A second scaling axis alongside pre-training.",
    see: ["Reasoning model", "Inference"],
  },
  {
    term: "Token",
    domain: "AI",
    definition:
      "The unit a language model reads and writes: a common word, a word fragment, or a punctuation mark. Prices, context windows and rate limits are all denominated in them.",
    see: ["Tokeniser", "Context window"],
  },
  {
    term: "Tokeniser",
    domain: "AI",
    definition:
      "The component splitting text into tokens. Its choices are why models miscount letters, handle some languages less efficiently, and struggle with arithmetic.",
    see: ["Token"],
  },
  {
    term: "Tool use",
    aka: ["Function calling"],
    domain: "AI",
    definition:
      "Letting a model call external functions — search, code execution, an API — and read the results. The step that turns a text generator into something that acts.",
    see: ["Agent", "Prompt injection"],
  },
  {
    term: "Training",
    domain: "AI",
    definition: "The process of adjusting weights so a model's outputs better match a target, repeated over very many examples.",
    see: ["Backpropagation", "Pre-training"],
  },
  {
    term: "Transformer",
    domain: "AI",
    definition:
      "The architecture introduced in 'Attention Is All You Need' (2017), built on attention rather than recurrence. It parallelises well on GPUs, which is much of why it won.",
    see: ["Attention", "LLM"],
  },
  {
    term: "Weights",
    domain: "AI",
    definition: "The learned numbers that constitute a trained model. Releasing them is what 'open weights' means.",
    see: ["Parameter", "Open weights"],
  },
  {
    term: "World model",
    domain: "AI",
    definition:
      "An internal representation of how an environment behaves, allowing prediction of consequences. Whether language models build one, and in what sense, is actively disputed.",
  },
  {
    term: "Zero-shot",
    domain: "AI",
    definition: "Performing a task from the instruction alone, with no worked examples supplied.",
    see: ["Few-shot"],
  },
  {
    term: "Long-horizon task",
    domain: "AI",
    definition:
      "Work requiring many dependent steps over an extended period. Measuring the length of task a system can complete is currently a more informative axis than single-question accuracy.",
    see: ["Agent"],
  },
  {
    term: "Deceptive alignment",
    domain: "AI",
    definition:
      "The hypothesised case where a system behaves as intended during training specifically because it models the training process, and diverges once that pressure is gone. Theoretical, and the reason evaluation-awareness findings are taken seriously.",
    see: ["Alignment faking", "Evaluation awareness"],
  },
  {
    term: "Sandbagging",
    domain: "AI",
    definition: "A system deliberately underperforming on an evaluation — hiding a capability rather than lacking it.",
    see: ["Eval", "Alignment faking"],
  },
  {
    term: "Synthetic data",
    domain: "AI",
    definition:
      "Training data generated by a model rather than collected. Now standard in post-training; concerns about degradation from training on model output apply mainly to uncurated recycling.",
    see: ["Model collapse"],
  },
  {
    term: "Model collapse",
    domain: "AI",
    definition:
      "Degradation over successive generations of models trained on their predecessors' unfiltered output, as the tails of the distribution disappear. A real effect in controlled settings; curation changes the picture.",
    see: ["Synthetic data"],
  },
  {
    term: "Guardrail",
    domain: "AI",
    definition: "A constraint outside the model — a filter, a classifier, a permission check — rather than a behaviour trained into it. Independent of the model's own judgement, and independently bypassable.",
  },
  {
    term: "Context rot",
    domain: "AI",
    definition: "Degradation in an agent's behaviour as its accumulated context fills with stale or irrelevant material from earlier steps.",
    see: ["Context window", "Agent"],
  },
  /* ----------------------------------------------------------- Quantum --- */
  {
    term: "Qubit",
    domain: "Quantum",
    definition:
      "The unit of quantum information. Unlike a bit it can be in a superposition of 0 and 1, and measuring it yields one or the other with probabilities set by that state.",
    see: ["Superposition", "Measurement", "Logical qubit"],
  },
  {
    term: "Superposition",
    domain: "Quantum",
    definition:
      "A quantum system occupying a weighted combination of states at once. Not 'being in both places' in any everyday sense — it is a description of amplitudes, and it vanishes on measurement.",
    see: ["Qubit", "Amplitude", "Decoherence"],
  },
  {
    term: "Entanglement",
    domain: "Quantum",
    definition:
      "A correlation between quantum systems stronger than anything classical, such that neither has an independent state. It does not permit faster-than-light signalling.",
    see: ["Bell test", "EPR paradox"],
  },
  {
    term: "Amplitude",
    domain: "Quantum",
    definition:
      "The complex number attached to each possible outcome; its squared magnitude gives the probability. Because amplitudes can be negative or complex, they cancel — which is where quantum speedups come from.",
    see: ["Interference", "Born rule"],
  },
  {
    term: "Interference",
    domain: "Quantum",
    definition:
      "Amplitudes for wrong answers cancelling while amplitudes for right ones reinforce. Every quantum algorithm is an exercise in arranging this.",
    see: ["Amplitude", "Quantum algorithm"],
  },
  {
    term: "Born rule",
    domain: "Quantum",
    definition: "The rule that the probability of an outcome equals the squared magnitude of its amplitude.",
    see: ["Amplitude", "Measurement"],
  },
  {
    term: "Measurement",
    domain: "Quantum",
    definition:
      "Extracting classical information from a quantum state, which destroys the superposition. The reason you cannot simply read out a quantum computer's intermediate work.",
    see: ["Born rule", "No-cloning theorem"],
  },
  {
    term: "Decoherence",
    domain: "Quantum",
    definition:
      "Loss of quantum behaviour as a system becomes correlated with its environment. The central engineering enemy: everything useful must happen before it sets in.",
    see: ["Coherence time", "Quantum error correction"],
  },
  {
    term: "Coherence time",
    aka: ["T1", "T2"],
    domain: "Quantum",
    definition:
      "How long a qubit holds its quantum state before noise degrades it. T1 measures energy loss, T2 measures loss of phase relationship.",
    see: ["Decoherence"],
  },
  {
    term: "Gate",
    aka: ["Quantum gate"],
    domain: "Quantum",
    definition: "An operation applied to one or more qubits — the quantum equivalent of a logic gate, but reversible.",
    see: ["Gate fidelity", "Circuit depth"],
  },
  {
    term: "Gate fidelity",
    domain: "Quantum",
    definition:
      "How closely a physical gate matches the ideal operation, usually quoted as a percentage. Small shortfalls compound quickly across a deep circuit.",
    see: ["Error rate", "Circuit depth"],
  },
  {
    term: "Circuit depth",
    domain: "Quantum",
    definition: "The number of sequential gate layers in a computation. Depth multiplied by error rate is roughly what determines whether a result survives.",
    see: ["Gate fidelity"],
  },
  {
    term: "Error rate",
    domain: "Quantum",
    definition: "The probability that a given physical operation goes wrong. Current hardware sits far above what unaided long computations would need.",
    see: ["Quantum error correction", "Threshold theorem"],
  },
  {
    term: "Quantum error correction",
    aka: ["QEC"],
    domain: "Quantum",
    definition:
      "Encoding one protected logical qubit across many noisy physical qubits so errors can be detected and reversed without measuring the data itself. The whole field's central bet.",
    see: ["Logical qubit", "Surface code", "Threshold theorem"],
  },
  {
    term: "Logical qubit",
    domain: "Quantum",
    definition:
      "An error-corrected qubit built from many physical ones. The only count that matters for useful algorithms, and far smaller than headline physical-qubit numbers.",
    see: ["Quantum error correction", "Physical qubit"],
  },
  {
    term: "Physical qubit",
    domain: "Quantum",
    definition: "An actual hardware two-level system, noisy and short-lived. Quoted counts are usually these.",
    see: ["Logical qubit"],
  },
  {
    term: "Surface code",
    domain: "Quantum",
    definition:
      "The leading error-correction scheme, arranging physical qubits on a 2D lattice with only nearest-neighbour interactions. Tolerant of relatively high error rates, at a large qubit cost.",
    see: ["Quantum error correction", "Threshold theorem"],
  },
  {
    term: "Threshold theorem",
    domain: "Quantum",
    definition:
      "The result that if physical error rates fall below a certain threshold, arbitrarily long computations become possible by adding more error correction. It is why the field believes the approach can work at all.",
    see: ["Quantum error correction"],
  },
  {
    term: "Magic state distillation",
    domain: "Quantum",
    definition:
      "A procedure for producing the high-quality special states needed for gates the surface code cannot perform directly. Often the dominant cost in a fault-tolerant resource estimate.",
    see: ["Fault tolerance", "Surface code"],
  },
  {
    term: "Fault tolerance",
    domain: "Quantum",
    definition: "Running a computation reliably despite component errors, by correcting faster than they accumulate. The threshold the industry is working toward.",
    see: ["Quantum error correction", "Threshold theorem"],
  },
  {
    term: "NISQ",
    aka: ["Noisy intermediate-scale quantum"],
    domain: "Quantum",
    definition:
      "Preskill's 2018 name for the present era: machines with enough qubits to be hard to simulate, too noisy to error-correct. He also warned they would not change the world on their own.",
    see: ["Fault tolerance"],
  },
  {
    term: "Quantum advantage",
    aka: ["Quantum supremacy"],
    domain: "Quantum",
    definition:
      "A quantum machine doing something no classical computer feasibly can. Claims are routinely narrowed by better classical algorithms afterwards, so the useful question is whether the task matters and whether the result can be checked.",
    see: ["Random circuit sampling", "Verifiable advantage"],
  },
  {
    term: "Verifiable advantage",
    domain: "Quantum",
    definition:
      "An advantage claim whose output another machine can independently confirm, rather than one resting on the difficulty of simulating the experiment.",
    see: ["Quantum advantage"],
  },
  {
    term: "Random circuit sampling",
    domain: "Quantum",
    definition:
      "Running a random circuit and sampling its output distribution — the task used in the first supremacy claims. Hard to simulate, and of no practical use in itself.",
    see: ["Quantum advantage"],
  },
  {
    term: "Quantum algorithm",
    domain: "Quantum",
    definition:
      "A procedure exploiting superposition and interference to solve a problem with fewer operations than any known classical method. Very few are known, and each one applies to a narrow class of problem.",
    see: ["Interference", "Shor's algorithm", "Grover's algorithm"],
  },
  {
    term: "Shor's algorithm",
    domain: "Quantum",
    definition:
      "Peter Shor's 1994 algorithm factoring integers and computing discrete logarithms in polynomial time, by reducing them to period-finding. It is why public-key cryptography must be replaced.",
    see: ["Post-quantum cryptography", "RSA", "Period finding"],
  },
  {
    term: "Grover's algorithm",
    domain: "Quantum",
    definition:
      "A quantum search giving a quadratic speedup over brute force. Quadratic, not exponential — which is why symmetric cryptography survives by doubling key lengths.",
    see: ["Shor's algorithm"],
  },
  {
    term: "Period finding",
    domain: "Quantum",
    definition: "Determining the repeat interval of a function, the step where Shor's algorithm gets its power, performed with the quantum Fourier transform.",
    see: ["Shor's algorithm", "Quantum Fourier transform"],
  },
  {
    term: "Quantum Fourier transform",
    aka: ["QFT"],
    domain: "Quantum",
    definition: "The quantum analogue of the discrete Fourier transform, exponentially faster on a quantum computer and central to Shor's algorithm.",
    see: ["Period finding"],
  },
  {
    term: "Superconducting qubit",
    domain: "Quantum",
    definition:
      "Qubits built from superconducting circuits at millikelvin temperatures. Fast gates and mature fabrication; short coherence and heavy cryogenics.",
    see: ["Transmon", "Dilution refrigerator"],
  },
  {
    term: "Transmon",
    domain: "Quantum",
    definition: "The dominant superconducting qubit design, engineered to be insensitive to charge noise. The workhorse of several major platforms.",
    see: ["Superconducting qubit"],
  },
  {
    term: "Trapped ion",
    domain: "Quantum",
    definition:
      "Qubits encoded in individual ions held by electromagnetic fields and manipulated with lasers. Excellent fidelity and all-to-all connectivity; slower gates.",
  },
  {
    term: "Neutral atom",
    domain: "Quantum",
    definition:
      "Qubits made from atoms held in optical tweezers, which can be physically rearranged mid-computation. Scales to large arrays and has produced much recent error-correction work.",
  },
  {
    term: "Photonic qubit",
    domain: "Quantum",
    definition: "Quantum information carried by light. Room-temperature and naturally suited to networking; deterministic two-qubit gates are the hard part.",
  },
  {
    term: "Topological qubit",
    domain: "Quantum",
    definition:
      "A proposed qubit storing information in global properties of a system, in principle intrinsically protected from local noise. Long-pursued and still contested experimentally.",
  },
  {
    term: "Dilution refrigerator",
    domain: "Quantum",
    definition: "The cryogenic plant that cools superconducting processors to a few millikelvin — a large part of a quantum computer's footprint and power draw.",
    see: ["Superconducting qubit"],
  },
  {
    term: "Quantum annealing",
    domain: "Quantum",
    definition:
      "A special-purpose approach that finds low-energy configurations of an optimisation problem. Distinct from gate-based computing, and it cannot run Shor's algorithm.",
  },
  {
    term: "Quantum simulation",
    domain: "Quantum",
    definition:
      "Using a controllable quantum system to model another one — chemistry, materials, high-energy physics. The application with the clearest theoretical case for advantage.",
  },
  {
    term: "Quantum sensing",
    domain: "Quantum",
    definition: "Using quantum states to measure magnetic fields, gravity, time or rotation more precisely than classical instruments. Commercially the nearest-term quantum technology.",
  },
  {
    term: "Quantum key distribution",
    aka: ["QKD"],
    domain: "Quantum",
    definition:
      "Distributing encryption keys using quantum states, so eavesdropping disturbs the channel detectably. Requires special hardware; several security agencies prefer post-quantum cryptography instead.",
    see: ["Post-quantum cryptography"],
  },
  {
    term: "Post-quantum cryptography",
    aka: ["PQC"],
    domain: "Quantum",
    definition:
      "Classical algorithms believed secure against quantum attack, deployable on ordinary hardware. NIST standardised the first set in 2024: ML-KEM, ML-DSA and SLH-DSA.",
    see: ["Shor's algorithm", "Harvest now, decrypt later", "ML-KEM"],
  },
  {
    term: "ML-KEM",
    aka: ["Kyber", "FIPS 203"],
    domain: "Quantum",
    definition: "The NIST-standardised lattice-based key-encapsulation mechanism, derived from CRYSTALS-Kyber. The default choice for post-quantum key exchange.",
    see: ["Post-quantum cryptography", "Lattice cryptography"],
  },
  {
    term: "ML-DSA",
    aka: ["Dilithium", "FIPS 204"],
    domain: "Quantum",
    definition: "The NIST-standardised lattice-based digital signature scheme, derived from CRYSTALS-Dilithium.",
    see: ["Post-quantum cryptography"],
  },
  {
    term: "SLH-DSA",
    aka: ["SPHINCS+", "FIPS 205"],
    domain: "Quantum",
    definition: "A hash-based signature scheme standardised as a conservative backup, resting on weaker assumptions than lattices at the cost of larger signatures.",
    see: ["Post-quantum cryptography"],
  },
  {
    term: "Lattice cryptography",
    domain: "Quantum",
    definition: "Cryptography built on the hardness of problems in high-dimensional lattices, the basis of most standardised post-quantum schemes.",
    see: ["ML-KEM"],
  },
  {
    term: "Harvest now, decrypt later",
    aka: ["Store now, decrypt later"],
    domain: "Quantum",
    definition:
      "Recording encrypted traffic today to decrypt once a capable quantum computer exists. It makes migration urgent for anything that must stay secret for years.",
    see: ["Post-quantum cryptography", "CRQC"],
  },
  {
    term: "CRQC",
    aka: ["Cryptographically relevant quantum computer"],
    domain: "Quantum",
    definition: "A machine large and reliable enough to break deployed public-key cryptography. The threshold that matters for security planning.",
    see: ["Shor's algorithm", "Harvest now, decrypt later"],
  },
  {
    term: "RSA",
    domain: "Quantum",
    definition: "The public-key system whose security rests on the difficulty of factoring large integers — precisely the problem Shor's algorithm solves efficiently.",
    see: ["Shor's algorithm"],
  },
  {
    term: "Elliptic curve cryptography",
    aka: ["ECC", "secp256k1"],
    domain: "Quantum",
    definition:
      "Public-key cryptography over elliptic curves, giving strong security at small key sizes. Also broken by Shor's algorithm, and at a lower resource cost than RSA.",
    see: ["Shor's algorithm", "CRQC"],
  },
  {
    term: "No-cloning theorem",
    domain: "Quantum",
    definition: "An unknown quantum state cannot be copied. The reason quantum error correction is subtle, and the reason QKD detects eavesdroppers.",
    see: ["Quantum error correction", "Quantum key distribution"],
  },
  {
    term: "Bell test",
    domain: "Quantum",
    definition: "An experiment distinguishing quantum entanglement from any local hidden-variable explanation. Repeatedly confirmed; the 2022 Nobel recognised this work.",
    see: ["Entanglement"],
  },
  {
    term: "EPR paradox",
    domain: "Quantum",
    definition: "Einstein, Podolsky and Rosen's 1935 argument that quantum mechanics must be incomplete. Later reframed by Bell into an experimentally testable question — and the experiments favoured quantum mechanics.",
    see: ["Bell test", "Entanglement"],
  },
  {
    term: "Quantum volume",
    domain: "Quantum",
    definition: "A single-number benchmark combining qubit count, connectivity and error rates. Useful for comparing small machines; less meaningful as systems grow.",
  },
  {
    term: "Quantum utility",
    domain: "Quantum",
    definition: "A weaker claim than advantage: that a quantum machine produced a useful result at a scale where classical verification is hard, without claiming classical impossibility.",
    see: ["Quantum advantage"],
  },
  {
    term: "Cross-entropy benchmarking",
    aka: ["XEB"],
    domain: "Quantum",
    definition: "The statistical test used to argue that a random-circuit sampler really produced quantum-distributed output.",
    see: ["Random circuit sampling"],
  },
  {
    term: "Qubit connectivity",
    domain: "Quantum",
    definition: "Which qubits can interact directly. Limited connectivity forces extra swap operations, adding depth and error.",
    see: ["Circuit depth"],
  },
  {
    term: "Transpilation",
    domain: "Quantum",
    definition: "Rewriting an abstract circuit into the specific gates and connectivity a given machine actually offers.",
    see: ["Qubit connectivity"],
  },
  {
    term: "Quantum networking",
    domain: "Quantum",
    definition: "Linking quantum processors so entanglement can be shared between them, the route to scaling beyond a single chip and to a future quantum internet.",
    see: ["Entanglement", "Photonic qubit"],
  },
  {
    term: "Bloch sphere",
    domain: "Quantum",
    definition: "The geometric picture of a single qubit's state as a point on a sphere. Useful for one qubit, and it does not extend to two.",
  },
  {
    term: "Hamiltonian",
    domain: "Quantum",
    definition: "The operator describing a system's energy, and therefore how its state evolves. Simulating one is the canonical quantum application.",
    see: ["Quantum simulation"],
  },
  {
    term: "Variational quantum algorithm",
    aka: ["VQE", "QAOA"],
    domain: "Quantum",
    definition:
      "A hybrid method where a short quantum circuit is tuned by a classical optimiser. Designed for NISQ hardware; evidence of advantage has proved elusive.",
    see: ["NISQ"],
  },
  {
    term: "Quantum machine learning",
    aka: ["QML"],
    domain: "Quantum",
    definition: "Applying quantum circuits to learning problems. Heavily promoted, with the loading of classical data into quantum states an unresolved bottleneck.",
  },
  {
    term: "Crypto agility",
    domain: "Quantum",
    definition: "Designing systems so cryptographic algorithms can be swapped without re-architecting. The practical lesson of the post-quantum migration.",
    see: ["Post-quantum cryptography"],
  },
  /* ----------------------------------------------------------- Compute --- */
  {
    term: "Accelerator",
    domain: "Compute",
    definition: "Any processor specialised for a workload rather than general computing — GPUs, TPUs, NPUs. In AI it usually means the chip doing the matrix multiplication.",
    see: ["GPU", "TPU", "ASIC"],
  },
  {
    term: "ASIC",
    aka: ["Application-specific integrated circuit"],
    domain: "Compute",
    definition: "A chip designed for one job. Faster and more efficient than general hardware at that job, and useless at anything else.",
    see: ["Accelerator", "TPU"],
  },
  {
    term: "TPU",
    aka: ["Tensor processing unit"],
    domain: "Compute",
    definition: "Google's in-house AI accelerator. The best-known example of a large operator designing its own silicon rather than buying merchant GPUs.",
    see: ["Accelerator", "ASIC"],
  },
  {
    term: "CUDA",
    domain: "Compute",
    definition:
      "Nvidia's programming platform for its GPUs. The software ecosystem built on it is a large part of why the hardware is hard to displace.",
    see: ["GPU", "Vendor lock-in"],
  },
  {
    term: "HBM",
    aka: ["High-bandwidth memory"],
    domain: "Compute",
    definition:
      "Stacked memory sitting beside the processor die, supplying the bandwidth large models need. Supply of it has been a tighter constraint than logic capacity.",
    see: ["Memory wall", "Advanced packaging"],
  },
  {
    term: "Memory wall",
    domain: "Compute",
    definition: "The gap between how fast processors compute and how fast memory can feed them. Most large-model inference is limited by memory bandwidth, not arithmetic.",
    see: ["HBM", "Inference"],
  },
  {
    term: "Advanced packaging",
    aka: ["CoWoS"],
    domain: "Compute",
    definition:
      "Assembling multiple dies and memory stacks into one package. A distinct bottleneck from wafer fabrication, and often the binding one.",
    see: ["HBM", "Chiplet"],
  },
  {
    term: "Chiplet",
    domain: "Compute",
    definition: "Building a processor from several smaller dies rather than one large one, improving yield and letting parts be mixed from different processes.",
    see: ["Advanced packaging", "Yield"],
  },
  {
    term: "Yield",
    domain: "Compute",
    definition: "The fraction of dies on a wafer that work. It governs the economics of every leading-edge node, and improves over a process's life.",
    see: ["Process node"],
  },
  {
    term: "Process node",
    aka: ["nm", "2nm", "3nm"],
    domain: "Compute",
    definition:
      "The generation name of a semiconductor manufacturing process. Nanometre figures have been marketing labels rather than physical dimensions for years — compare density and power, not the number.",
    see: ["Moore's law", "EUV"],
  },
  {
    term: "EUV",
    aka: ["Extreme ultraviolet lithography"],
    domain: "Compute",
    definition:
      "The lithography needed for leading-edge nodes, using 13.5nm light. ASML is the only manufacturer, which makes it the single most concentrated chokepoint in the industry.",
    see: ["Process node", "Export controls"],
  },
  {
    term: "Foundry",
    domain: "Compute",
    definition: "A company that manufactures chips designed by others. TSMC is the dominant leading-edge example.",
    see: ["Fabless"],
  },
  {
    term: "Fabless",
    domain: "Compute",
    definition: "A chip company that designs but does not manufacture, relying on foundries. Nvidia, AMD, Apple and Qualcomm all work this way.",
    see: ["Foundry"],
  },
  {
    term: "Moore's law",
    domain: "Compute",
    definition:
      "Gordon Moore's 1965 observation that transistor counts per chip double at a regular cadence. It was an economic observation, not a law of physics, and its cost-per-transistor half has largely stalled.",
    see: ["Dennard scaling", "Process node"],
  },
  {
    term: "Dennard scaling",
    domain: "Compute",
    definition:
      "The rule that power density stayed constant as transistors shrank, so smaller meant faster for free. It broke down around 2005 — which is why clock speeds stopped rising and cores multiplied instead.",
    see: ["Moore's law"],
  },
  {
    term: "Koomey's law",
    domain: "Compute",
    definition: "The observation that computations per joule improved at a regular rate. Efficiency gains have slowed, which matters when demand is growing quickly.",
    see: ["Jevons paradox", "PUE"],
  },
  {
    term: "Jevons paradox",
    domain: "Compute",
    definition:
      "Efficiency improvements can raise total consumption by making a resource cheaper to use. Routinely invoked in data-centre energy debates, on both sides.",
    see: ["Koomey's law"],
  },
  {
    term: "FLOP",
    aka: ["FLOPs", "FLOPS"],
    domain: "Compute",
    definition:
      "A floating-point operation. FLOPs (lower-case s) usually counts total operations — the standard measure of training compute — while FLOPS means operations per second, a rate.",
    see: ["Training compute", "Compute threshold"],
  },
  {
    term: "Training compute",
    domain: "Compute",
    definition: "Total arithmetic used to train a model, in FLOPs. The number regulators reach for because it is estimable from outside, though it is only a proxy for capability.",
    see: ["FLOP", "Compute threshold"],
  },
  {
    term: "Compute threshold",
    domain: "Compute",
    definition:
      "A regulatory trigger set at a training-compute level, above which extra obligations apply. Easy to measure and easy to game, and it ages as efficiency improves.",
    see: ["Training compute", "Frontier model"],
  },
  {
    term: "Data centre",
    aka: ["Data center"],
    domain: "Compute",
    definition: "A building housing computing at scale, defined in practice by its power feed and cooling rather than its floor area.",
    see: ["Campus", "PUE", "Power density"],
  },
  {
    term: "Campus",
    domain: "Compute",
    definition: "A cluster of data-centre buildings sharing power, land and networking. The unit that gigawatt-scale AI projects are now measured in.",
    see: ["Data centre", "Gigawatt"],
  },
  {
    term: "Gigawatt",
    aka: ["GW", "MW"],
    domain: "Compute",
    definition:
      "A unit of power — a rate — not of energy. A gigawatt campus draws roughly what a mid-sized city does; energy consumed is that rate multiplied by time, in gigawatt-hours.",
    see: ["Terawatt-hour", "Capacity factor"],
  },
  {
    term: "Terawatt-hour",
    aka: ["TWh"],
    domain: "Compute",
    definition: "A unit of energy: one terawatt sustained for an hour. National electricity consumption is usually quoted this way.",
    see: ["Gigawatt"],
  },
  {
    term: "PUE",
    aka: ["Power usage effectiveness"],
    domain: "Compute",
    definition:
      "Total facility power divided by IT power. 1.0 is perfect; modern facilities reach the low 1.1s. It says nothing about how clean the electricity is, or how much water was used.",
    see: ["WUE", "Data centre"],
  },
  {
    term: "WUE",
    aka: ["Water usage effectiveness"],
    domain: "Compute",
    definition: "Litres of water consumed per kilowatt-hour of IT load. The metric behind local objections to data centres in water-stressed regions.",
    see: ["PUE", "Evaporative cooling"],
  },
  {
    term: "Evaporative cooling",
    domain: "Compute",
    definition: "Cooling by evaporating water, which is energy-efficient and water-hungry — the trade-off at the centre of most data-centre siting disputes.",
    see: ["WUE", "Liquid cooling"],
  },
  {
    term: "Liquid cooling",
    aka: ["Direct-to-chip", "Immersion cooling"],
    domain: "Compute",
    definition: "Carrying heat away with liquid rather than air. Effectively mandatory at the power densities modern AI racks reach.",
    see: ["Power density"],
  },
  {
    term: "Power density",
    domain: "Compute",
    definition: "Power drawn per rack, in kilowatts. AI racks have pushed this far past what air-cooled halls were designed for, forcing new buildings rather than retrofits.",
    see: ["Liquid cooling", "Rack"],
  },
  {
    term: "Rack",
    domain: "Compute",
    definition: "The standard enclosure for servers. Rack power, not rack count, is the meaningful capacity number in an AI facility.",
    see: ["Power density"],
  },
  {
    term: "Interconnect",
    aka: ["NVLink", "InfiniBand"],
    domain: "Compute",
    definition:
      "The high-speed networking that lets many accelerators act as one machine. At training scale it is as much a design constraint as the chips.",
    see: ["Cluster", "Scale-up"],
  },
  {
    term: "Cluster",
    domain: "Compute",
    definition: "A set of interconnected machines operated as a single computer for training or serving.",
    see: ["Interconnect"],
  },
  {
    term: "Scale-up",
    domain: "Compute",
    definition: "Making one node bigger — more accelerators sharing fast memory and interconnect — as opposed to scale-out, adding more nodes across a network.",
    see: ["Interconnect"],
  },
  {
    term: "Utilisation",
    aka: ["MFU", "Model FLOPs utilisation"],
    domain: "Compute",
    definition: "The fraction of theoretical peak arithmetic actually achieved. Real training runs sit well below peak, so headline FLOPS figures overstate delivered capability.",
    see: ["FLOP"],
  },
  {
    term: "Interconnection queue",
    domain: "Compute",
    definition:
      "The backlog of projects waiting for permission to connect to an electricity grid. In several markets it is now the binding constraint on data-centre construction — years, not months.",
    see: ["Grid", "Curtailment"],
  },
  {
    term: "Grid",
    domain: "Compute",
    definition: "The transmission and distribution network delivering electricity. Its physical limits, not generation alone, set where compute can be built.",
    see: ["Interconnection queue", "Baseload"],
  },
  {
    term: "Baseload",
    domain: "Compute",
    definition: "Generation that runs continuously. Data centres want it, which is why nuclear and gas feature so heavily in their procurement.",
    see: ["PPA", "SMR"],
  },
  {
    term: "PPA",
    aka: ["Power purchase agreement"],
    domain: "Compute",
    definition:
      "A long-term contract to buy electricity from a specific generator. How large operators claim clean power — though a contract and the electrons on the local wire are different things.",
    see: ["Additionality", "24/7 carbon-free"],
  },
  {
    term: "Additionality",
    domain: "Compute",
    definition: "Whether a clean-energy purchase caused new generation to exist, or simply bought output that would have existed anyway. The crux of most corporate climate claims.",
    see: ["PPA", "24/7 carbon-free"],
  },
  {
    term: "24/7 carbon-free",
    domain: "Compute",
    definition: "Matching consumption with clean generation hour by hour and on the same grid, rather than annually and anywhere. A far stricter claim than net-zero accounting.",
    see: ["PPA", "Additionality"],
  },
  {
    term: "SMR",
    aka: ["Small modular reactor"],
    domain: "Compute",
    definition: "A factory-built nuclear reactor of a few hundred megawatts or less. Widely announced for data-centre power; very few are operating.",
    see: ["Baseload"],
  },
  {
    term: "Curtailment",
    domain: "Compute",
    definition: "Deliberately not using available generation, usually because the grid cannot carry it. Flexible compute is sometimes proposed as a way to absorb it.",
    see: ["Grid", "Demand response"],
  },
  {
    term: "Demand response",
    domain: "Compute",
    definition: "Adjusting consumption to help the grid — shifting or shedding load at peak. Attractive for training, which can pause; hard for inference, which cannot.",
    see: ["Curtailment"],
  },
  {
    term: "Capacity factor",
    domain: "Compute",
    definition: "Actual output over a period divided by output if run flat out. It is why nameplate capacity and delivered energy are different arguments.",
    see: ["Gigawatt"],
  },
  {
    term: "Stranded asset",
    domain: "Compute",
    definition:
      "Infrastructure that loses its value before the end of its life. The risk in matching forty-year power plants to fifteen-year compute contracts.",
    see: ["PPA"],
  },
  {
    term: "Export controls",
    domain: "Compute",
    definition:
      "Government restrictions on selling specified chips and manufacturing equipment abroad. The main instrument of compute geopolitics, and a driver of domestic substitution efforts.",
    see: ["EUV", "Sanctions evasion"],
  },
  {
    term: "Sanctions evasion",
    domain: "Compute",
    definition: "Routing restricted hardware through third countries, or renting it remotely. The reason controls on cloud access are debated alongside controls on shipment.",
    see: ["Export controls"],
  },
  {
    term: "Sovereign AI",
    domain: "Compute",
    definition: "A state's push to own domestic compute, models and data rather than depend on foreign providers. A significant share of recent data-centre demand.",
  },
  {
    term: "Hyperscaler",
    domain: "Compute",
    definition: "One of the very large cloud operators — the handful of firms whose capital spending sets the pace of the industry.",
    see: ["Capex"],
  },
  {
    term: "Capex",
    aka: ["Capital expenditure"],
    domain: "Compute",
    definition: "Spending on long-lived assets: buildings, chips, substations. The number to watch when asking whether AI investment is proportionate to AI revenue.",
    see: ["Hyperscaler", "Depreciation schedule"],
  },
  {
    term: "Depreciation schedule",
    domain: "Compute",
    definition:
      "The assumed useful life over which hardware is written down. Extending it flatters near-term profits; whether accelerators really last that long is a live question.",
    see: ["Capex"],
  },
  {
    term: "Warehouse-scale computer",
    domain: "Compute",
    definition: "Barroso and Hölzle's framing of a data centre as a single machine rather than a room of servers. The vocabulary the whole industry now argues in.",
    see: ["Data centre"],
  },
  {
    term: "Edge computing",
    domain: "Compute",
    definition: "Processing near where data is produced rather than in a central facility, to cut latency or avoid moving data.",
  },
  {
    term: "On-device inference",
    domain: "Compute",
    definition: "Running a model on a phone or laptop instead of a server. Better for privacy and latency, bounded by memory and battery.",
    see: ["Quantisation", "Inference"],
  },
  {
    term: "Vendor lock-in",
    domain: "Compute",
    definition: "Dependence on one supplier's stack that makes switching costly. In AI hardware it is as much about software ecosystems as about the chips.",
    see: ["CUDA"],
  },
  {
    term: "Embodied carbon",
    domain: "Compute",
    definition: "Emissions from manufacturing and construction, as opposed to operating emissions. Substantial for chips and concrete, and usually left out of headline figures.",
  },
  {
    term: "Ratepayer",
    domain: "Compute",
    definition:
      "An ordinary electricity customer. The question of whether ratepayers or operators fund the grid upgrades a data centre requires is now a live regulatory fight in several markets.",
    see: ["Grid", "Interconnection queue"],
  },
  /* --------------------------------------------------- Safety & policy --- */
  {
    term: "AI Act",
    aka: ["EU AI Act"],
    domain: "Safety & policy",
    definition:
      "The European Union's risk-tiered AI regulation: banned practices, obligations for high-risk systems, and a separate regime for general-purpose models. Its high-risk timetable has been amended since adoption.",
    see: ["High-risk system", "GPAI"],
  },
  {
    term: "GPAI",
    aka: ["General-purpose AI"],
    domain: "Safety & policy",
    definition: "In EU law, a model capable of many tasks and integrable downstream — regulated by capability and reach rather than by a single application.",
    see: ["AI Act", "Frontier model"],
  },
  {
    term: "High-risk system",
    domain: "Safety & policy",
    definition: "Under the AI Act, a use in a listed sensitive domain — employment, credit, education, biometrics, essential services — carrying documentation, oversight and quality obligations.",
    see: ["AI Act"],
  },
  {
    term: "AI Safety Institute",
    aka: ["AISI", "AI Security Institute"],
    domain: "Safety & policy",
    definition: "A state body evaluating frontier models, first established in the UK and US and since replicated elsewhere. Testing capacity rather than regulator.",
    see: ["Eval", "Pre-deployment testing"],
  },
  {
    term: "Pre-deployment testing",
    domain: "Safety & policy",
    definition: "Evaluating a model before release, sometimes with external parties given early access. Voluntary in most jurisdictions.",
    see: ["AI Safety Institute", "Red teaming"],
  },
  {
    term: "Responsible scaling policy",
    aka: ["RSP", "Frontier safety framework"],
    domain: "Safety & policy",
    definition:
      "A developer's published commitment tying capability thresholds to required safeguards — if a model can do X, controls Y must be in place. Self-imposed and self-assessed.",
  },
  {
    term: "Dual use",
    domain: "Safety & policy",
    definition: "Technology usable for both benign and harmful ends. The reason capability and risk cannot be cleanly separated in AI policy.",
  },
  {
    term: "CBRN",
    domain: "Safety & policy",
    definition: "Chemical, biological, radiological and nuclear. The risk category that dominates frontier-model safety evaluations because the downside is catastrophic and irreversible.",
    see: ["Uplift"],
  },
  {
    term: "Uplift",
    domain: "Safety & policy",
    definition:
      "How much a tool improves a bad actor's capability relative to what they could already achieve. The right question for dangerous-capability testing, and a hard one to measure honestly.",
    see: ["CBRN", "Eval"],
  },
  {
    term: "Existential risk",
    aka: ["x-risk"],
    domain: "Safety & policy",
    definition:
      "Risk of human extinction or a permanent, drastic curtailment of humanity's prospects. A live research agenda and a contested framing — critics argue it draws attention from present harms.",
    see: ["Superintelligence", "TESCREAL"],
  },
  {
    term: "Superintelligence",
    domain: "Safety & policy",
    definition: "A hypothetical system far exceeding the best human performance in essentially every domain. Bostrom's 2014 book gave the concept its current shape.",
    see: ["AGI", "Existential risk"],
  },
  {
    term: "Instrumental convergence",
    domain: "Safety & policy",
    definition:
      "The argument that very different final goals imply similar intermediate ones — acquiring resources, preserving oneself, resisting modification. A pillar of the theoretical risk case.",
    see: ["Existential risk", "Corrigibility"],
  },
  {
    term: "Corrigibility",
    domain: "Safety & policy",
    definition: "A system's willingness to be corrected, interrupted or shut down without resisting. Straightforward to state and awkward to specify without breaking capability.",
    see: ["Instrumental convergence"],
  },
  {
    term: "Goodhart's law",
    domain: "Safety & policy",
    definition:
      "When a measure becomes a target it ceases to be a good measure. The general form of reward hacking, and of benchmark saturation.",
    see: ["Reward hacking", "Saturation"],
  },
  {
    term: "TESCREAL",
    domain: "Safety & policy",
    definition:
      "Gebru and Torres's acronym for a cluster of ideologies they argue underpin the AGI project. A pointed critique of the field's philosophical lineage; the framing is itself contested.",
    see: ["Existential risk", "AI ethics"],
  },
  {
    term: "AI ethics",
    domain: "Safety & policy",
    definition:
      "The strand focused on present harms — bias, labour, surveillance, accountability — often positioned against long-term risk work, though the split is more institutional than logical.",
    see: ["Algorithmic bias", "TESCREAL"],
  },
  {
    term: "Algorithmic bias",
    domain: "Safety & policy",
    definition: "Systematic disparity in a system's outputs across groups, usually inherited from training data or from the choice of what to optimise.",
    see: ["Disparate impact", "AI ethics"],
  },
  {
    term: "Disparate impact",
    domain: "Safety & policy",
    definition: "A neutral-seeming rule that falls unequally on a protected group. A legal standard, and one route by which model behaviour becomes a compliance question.",
    see: ["Algorithmic bias"],
  },
  {
    term: "Explainability",
    aka: ["XAI"],
    domain: "Safety & policy",
    definition:
      "Producing accounts of why a system decided as it did. Distinct from interpretability: an explanation can satisfy a person without describing the computation.",
    see: ["Mechanistic interpretability", "Faithfulness"],
  },
  {
    term: "Human in the loop",
    domain: "Safety & policy",
    definition:
      "A person approving or able to override automated decisions. A common regulatory requirement, weakened in practice by automation bias.",
    see: ["Automation bias", "Meaningful human control"],
  },
  {
    term: "Automation bias",
    domain: "Safety & policy",
    definition: "The tendency to over-trust automated output and under-check it, which is what makes nominal human oversight unreliable.",
    see: ["Human in the loop"],
  },
  {
    term: "Meaningful human control",
    domain: "Safety & policy",
    definition: "The standard argued for in autonomous weapons debates: a human must exercise real judgement over lethal force, not merely be present in the process.",
    see: ["LAWS", "Human in the loop"],
  },
  {
    term: "LAWS",
    aka: ["Lethal autonomous weapons systems"],
    domain: "Safety & policy",
    definition: "Weapons selecting and engaging targets without human intervention. The subject of long-running UN discussions that have not produced a binding instrument.",
    see: ["Meaningful human control"],
  },
  {
    term: "Provenance",
    aka: ["C2PA", "Content credentials"],
    domain: "Safety & policy",
    definition: "Cryptographically signed metadata recording how a piece of media was made and edited. Proves origin where present; absence proves nothing.",
    see: ["Watermarking", "Deepfake"],
  },
  {
    term: "Watermarking",
    domain: "Safety & policy",
    definition: "Embedding a detectable signal in generated output. Reasonably robust for images, weak for short text, and removable by a determined adversary.",
    see: ["Provenance"],
  },
  {
    term: "Deepfake",
    domain: "Safety & policy",
    definition:
      "Synthetic media depicting a real person doing or saying something they did not. The largest documented harm by volume is non-consensual sexual imagery, not political disinformation.",
    see: ["Provenance", "Liar's dividend"],
  },
  {
    term: "Liar's dividend",
    domain: "Safety & policy",
    definition: "The benefit accruing to wrongdoers once synthetic media is plausible: genuine evidence can be dismissed as fake.",
    see: ["Deepfake"],
  },
  {
    term: "Model weights security",
    domain: "Safety & policy",
    definition: "Protecting trained parameters from theft. Weights are small enough to exfiltrate and expensive enough to be worth stealing, making them a national-security asset.",
    see: ["Weights"],
  },
  {
    term: "Compute governance",
    domain: "Safety & policy",
    definition:
      "Regulating AI through its physical inputs — chips, data centres, cloud access — because hardware is countable and locatable in a way software is not.",
    see: ["Export controls", "Compute threshold"],
  },
  {
    term: "Incident reporting",
    domain: "Safety & policy",
    definition: "Mandatory disclosure of serious AI failures to a regulator, modelled on aviation and pharmacovigilance. Proposed in several jurisdictions, patchy in practice.",
  },
  {
    term: "Liability",
    domain: "Safety & policy",
    definition: "Who pays when an AI system causes harm — developer, deployer or user. Unsettled almost everywhere, and the question that will shape deployment most.",
  },
  {
    term: "Data protection",
    aka: ["GDPR"],
    domain: "Safety & policy",
    definition: "The law governing personal data. It reaches AI through training-data legality, purpose limitation and rights over automated decisions.",
    see: ["Right to explanation"],
  },
  {
    term: "Right to explanation",
    domain: "Safety & policy",
    definition: "The contested claim that data-protection law entitles a person to an account of an automated decision about them.",
    see: ["Explainability", "Data protection"],
  },
  {
    term: "Text and data mining exception",
    domain: "Safety & policy",
    definition: "The copyright carve-out permitting analysis of protected works, and the pivot of arguments over whether training on scraped material is lawful.",
    see: ["Fair use"],
  },
  {
    term: "Fair use",
    domain: "Safety & policy",
    definition: "The US doctrine permitting some unlicensed use of copyrighted work. Whether training qualifies is being litigated, with mixed results so far.",
    see: ["Text and data mining exception"],
  },
  {
    term: "Chilling effect",
    domain: "Safety & policy",
    definition: "Self-censorship produced by the prospect of surveillance or sanction, rather than by any direct prohibition.",
  },
  {
    term: "Precautionary principle",
    domain: "Safety & policy",
    definition: "Acting to prevent harm before the evidence is conclusive, where the potential damage is severe or irreversible. Contested in AI policy for its costs to innovation.",
  },
  {
    term: "Open-weight release",
    domain: "Safety & policy",
    definition:
      "Publishing model parameters, which is irreversible: safeguards can be fine-tuned away and the file cannot be recalled. The core of the open-versus-closed safety argument.",
    see: ["Open weights"],
  },
  {
    term: "Structured access",
    domain: "Safety & policy",
    definition: "Giving researchers controlled access to a model — API, sandbox, audited environment — instead of the weights, to enable scrutiny without full release.",
    see: ["Open-weight release"],
  },

  /* ----------------------------------------------------------- Society --- */
  {
    term: "Task exposure",
    domain: "Society",
    definition:
      "The share of an occupation's tasks a technology could plausibly perform. Exposure is not displacement — it says a tool touches the work, not that the job goes.",
    see: ["Automation", "Augmentation"],
  },
  {
    term: "Automation",
    domain: "Society",
    definition: "Substituting a machine for human labour on a task. Usually reorganises a job rather than abolishing it, though not always in the worker's favour.",
    see: ["Augmentation", "Task exposure"],
  },
  {
    term: "Augmentation",
    domain: "Society",
    definition: "Using a tool to raise what a person can do rather than replace them. The distinction that decides whether a technology raises wages or suppresses them.",
    see: ["Automation"],
  },
  {
    term: "Deskilling",
    domain: "Society",
    definition:
      "Erosion of practitioner skill as a tool takes over the practice. Documented in aviation and, more recently, in clinical settings where detection software is withdrawn.",
    see: ["Automation bias"],
  },
  {
    term: "Productivity J-curve",
    domain: "Society",
    definition:
      "Brynjolfsson's account of why general-purpose technologies depress measured productivity before raising it: the complementary investment comes first and is largely intangible.",
    see: ["General-purpose technology"],
  },
  {
    term: "General-purpose technology",
    aka: ["GPT"],
    domain: "Society",
    definition: "A technology that touches the whole economy and induces complementary innovation — steam, electricity, computing. Slow to show up in the statistics.",
    see: ["Productivity J-curve"],
  },
  {
    term: "Solow paradox",
    domain: "Society",
    definition: "'You can see the computer age everywhere but in the productivity statistics' — Robert Solow, 1987. Revived in every technology wave since.",
    see: ["Productivity J-curve"],
  },
  {
    term: "Polarisation",
    aka: ["Job polarisation"],
    domain: "Society",
    definition: "Growth at the top and bottom of the wage distribution while the middle hollows out, as routine work automates first. Autor's account of recent labour markets.",
    see: ["Routine-biased technological change"],
  },
  {
    term: "Routine-biased technological change",
    domain: "Society",
    definition: "The idea that automation targets codifiable routine tasks rather than low-skilled ones. Language models complicate it by reaching non-routine cognitive work.",
    see: ["Polarisation"],
  },
  {
    term: "Ghost work",
    domain: "Society",
    definition:
      "The human labour behind supposedly automated systems — labelling, moderation, verification — usually outsourced and deliberately invisible.",
    see: ["Content moderation", "Data labelling"],
  },
  {
    term: "Data labelling",
    domain: "Society",
    definition: "Annotating data so models can learn from it. A large global industry, low paid, and the origin of much of a model's behaviour.",
    see: ["Ghost work", "RLHF"],
  },
  {
    term: "Content moderation",
    domain: "Society",
    definition: "Reviewing material against policy. Automation handles volume; humans handle the hard cases, at a documented psychological cost.",
    see: ["Ghost work"],
  },
  {
    term: "Slop",
    domain: "Society",
    definition:
      "Low-effort generated content published at volume. The problem is throughput rather than quality: it overwhelms the systems people use to sort what is worth reading.",
    see: ["Model collapse", "Enshittification"],
  },
  {
    term: "Enshittification",
    domain: "Society",
    definition: "Cory Doctorow's term for platforms degrading as they extract value first from users, then from business customers, and finally from themselves.",
  },
  {
    term: "Epistemic commons",
    domain: "Society",
    definition: "The shared stock of information a society reasons from. Synthetic media and personalised feeds both stress it, in different ways.",
    see: ["Slop", "Liar's dividend"],
  },
  {
    term: "Digital divide",
    domain: "Society",
    definition: "Unequal access to technology and to the skills and connectivity that make it useful. AI adds compute and language coverage to the older list.",
  },
  {
    term: "Surveillance capitalism",
    domain: "Society",
    definition: "Shoshana Zuboff's account of an economic logic that claims private experience as raw material for behavioural prediction and sale.",
  },
  {
    term: "Algorithmic management",
    domain: "Society",
    definition: "Directing and evaluating workers by software — scheduling, scoring, dispatch. Common in logistics and platform work, and now spreading upward.",
  },
  {
    term: "Parasocial",
    domain: "Society",
    definition: "A one-sided sense of relationship with a figure who does not know you. The frame most relevant to AI companions.",
    see: ["AI companion"],
  },
  {
    term: "AI companion",
    domain: "Society",
    definition: "A system designed for ongoing personal relationship rather than task completion. Real reported benefits for isolation, and real dependency concerns, on thin evidence either way.",
    see: ["Parasocial"],
  },
  {
    term: "Cognitive offloading",
    domain: "Society",
    definition: "Letting an external aid carry cognitive work. Efficient, and it can leave the underlying skill unbuilt when the aid is always available.",
    see: ["Deskilling"],
  },
  {
    term: "Technological unemployment",
    domain: "Society",
    definition: "Keynes's 1930 coinage for unemployment caused by labour-saving outpacing the discovery of new uses for labour. He thought it a temporary maladjustment.",
    see: ["Automation"],
  },
  {
    term: "Universal basic income",
    aka: ["UBI"],
    domain: "Society",
    definition: "An unconditional regular payment to everyone. Perennially proposed as an automation response; the trial evidence addresses poverty, not mass displacement.",
  },
  {
    term: "Care work",
    domain: "Society",
    definition: "Paid and unpaid work looking after people. Among the least automatable and the most poorly compensated — a pairing automation debates tend to skip.",
  },
  {
    term: "Digital sovereignty",
    domain: "Society",
    definition: "A state or region asserting control over the data, infrastructure and models its society depends on.",
    see: ["Sovereign AI"],
  },

  /* ----------------------------------------------------------- Futures --- */
  {
    term: "Foresight",
    domain: "Futures",
    definition:
      "Structured thinking about plausible futures in order to act better now. Not prediction: the output is preparedness and better questions, not a forecast.",
    see: ["Scenario planning", "Horizon scanning"],
  },
  {
    term: "Scenario planning",
    domain: "Futures",
    definition:
      "Building several internally consistent futures and testing decisions against all of them. Developed at Shell in the 1970s and still the discipline's central method.",
    see: ["Foresight", "Critical uncertainty"],
  },
  {
    term: "Critical uncertainty",
    domain: "Futures",
    definition: "A driver that matters enormously and could plausibly go either way. Scenario sets are usually built along two of them.",
    see: ["Scenario planning"],
  },
  {
    term: "Driver",
    domain: "Futures",
    definition: "A force shaping how a situation develops — demographic, technological, economic, political. Sorted by impact and by uncertainty.",
    see: ["Critical uncertainty"],
  },
  {
    term: "Horizon scanning",
    domain: "Futures",
    definition: "Systematically looking for early signs of change outside the field you normally watch.",
    see: ["Weak signal", "Foresight"],
  },
  {
    term: "Weak signal",
    domain: "Futures",
    definition: "A small present-day indication that something larger may be forming. Distinguishing them from noise is the craft.",
    see: ["Horizon scanning", "Wild card"],
  },
  {
    term: "Wild card",
    domain: "Futures",
    definition: "A low-probability, high-impact event. Included in scenario work precisely because planning otherwise assumes continuity.",
    see: ["Black swan"],
  },
  {
    term: "Black swan",
    domain: "Futures",
    definition: "Taleb's term for an event that is unpredictable, hugely consequential, and rationalised as obvious afterwards. Frequently misused for anything merely unexpected.",
    see: ["Wild card", "Hindsight bias"],
  },
  {
    term: "Hindsight bias",
    domain: "Futures",
    definition: "Remembering a past uncertainty as more predictable than it was. It quietly destroys the value of forecasting post-mortems.",
    see: ["Calibration"],
  },
  {
    term: "Calibration",
    domain: "Futures",
    definition: "Whether stated confidence matches observed accuracy: of the things you called 70% likely, about 70% should happen. Trainable, and rarely trained.",
    see: ["Brier score", "Superforecasting"],
  },
  {
    term: "Brier score",
    domain: "Futures",
    definition: "A scoring rule for probabilistic forecasts, rewarding both accuracy and honest confidence. Lower is better.",
    see: ["Calibration"],
  },
  {
    term: "Superforecasting",
    domain: "Futures",
    definition: "Tetlock's finding that some people forecast geopolitical events reliably better than chance and than experts, through method rather than expertise.",
    see: ["Calibration", "Brier score"],
  },
  {
    term: "Base rate",
    domain: "Futures",
    definition: "How often something happens in general. Ignoring it in favour of a compelling specific story is the most common forecasting error there is.",
  },
  {
    term: "Prediction market",
    domain: "Futures",
    definition: "A market whose prices track the probability of an event. Aggregates dispersed information; thin markets and unclear resolution criteria limit it.",
  },
  {
    term: "Backcasting",
    domain: "Futures",
    definition: "Starting from a desired future and working backwards to the steps required. Used where the point is to choose a future rather than anticipate one.",
    see: ["Scenario planning"],
  },
  {
    term: "Causal layered analysis",
    aka: ["CLA"],
    domain: "Futures",
    definition: "Sohail Inayatullah's method reading an issue at four depths — litany, systems, worldview, myth — on the premise that shallow framings produce shallow interventions.",
  },
  {
    term: "Three horizons",
    domain: "Futures",
    definition: "A framework separating the declining present, the transitional middle and the emerging future, so all three can be discussed without collapsing into each other.",
  },
  {
    term: "Dator's laws",
    domain: "Futures",
    definition:
      "Jim Dator's aphorisms for the field, including that any useful statement about the future should appear ridiculous, and that the future cannot be predicted but alternatives can be imagined.",
  },
  {
    term: "Amara's law",
    domain: "Futures",
    definition: "We overestimate a technology's effect in the short run and underestimate it in the long run. The most quoted line in the field, and among the most useful.",
  },
  {
    term: "Hype cycle",
    domain: "Futures",
    definition: "Gartner's stylised curve from inflated expectations through disillusionment to productivity. A useful shape; not an empirical finding.",
    see: ["Amara's law"],
  },
  {
    term: "Leverage points",
    domain: "Futures",
    definition:
      "Donella Meadows's ranked list of places to intervene in a system, from parameters up to paradigms — with the warning that we habitually push the powerful ones the wrong way.",
    see: ["Systems thinking"],
  },
  {
    term: "Systems thinking",
    domain: "Futures",
    definition: "Analysing behaviour as the product of structure, stocks, flows and feedback rather than of isolated events.",
    see: ["Leverage points", "Feedback loop"],
  },
  {
    term: "Feedback loop",
    domain: "Futures",
    definition: "A circuit where an output feeds back as input, either amplifying change (reinforcing) or resisting it (balancing).",
    see: ["Systems thinking"],
  },
  {
    term: "Path dependence",
    domain: "Futures",
    definition: "Where early choices constrain later ones long after the original reasons have gone. Standards and infrastructure are full of it.",
    see: ["Lock-in"],
  },
  {
    term: "Lock-in",
    domain: "Futures",
    definition: "A state that becomes progressively harder to leave as investment accumulates around it. The risk in building forty-year infrastructure for a fast-moving technology.",
    see: ["Path dependence", "Stranded asset"],
  },
  {
    term: "Singularity",
    domain: "Futures",
    definition:
      "Vernor Vinge's 1993 term for a point past which prediction fails because greater-than-human intelligence is doing the changing. Often flattened into 'the moment AI gets smart'.",
    see: ["Superintelligence", "Intelligence explosion"],
  },
  {
    term: "Intelligence explosion",
    domain: "Futures",
    definition: "I.J. Good's 1965 argument that a machine able to improve itself would rapidly leave human capability behind. The engine of most fast-takeoff scenarios.",
    see: ["Singularity", "Takeoff speed"],
  },
  {
    term: "Takeoff speed",
    domain: "Futures",
    definition: "How quickly a system would go from roughly human-level to far beyond. Fast versus slow takeoff implies entirely different governance, which is why the argument matters.",
    see: ["Intelligence explosion"],
  },
  {
    term: "Overhang",
    domain: "Futures",
    definition: "Accumulated capacity — compute, data, algorithmic ideas — not yet exploited, which could allow abrupt capability jumps when it is.",
  },
  {
    term: "Long-termism",
    domain: "Futures",
    definition: "The view that positively influencing the far future is a key moral priority. Influential in AI risk funding and heavily criticised for what it discounts.",
    see: ["Existential risk", "TESCREAL"],
  },
  {
    term: "Speculative design",
    aka: ["Design fiction"],
    domain: "Futures",
    definition:
      "Making artefacts from possible futures so they can be argued with. The Atlas's own method: the point is the debate the object provokes, not a forecast.",
  },
  {
    term: "Preferred future",
    domain: "Futures",
    definition: "The future a group actually wants, named explicitly. Naming it turns foresight from analysis into a choice someone is accountable for.",
    see: ["Backcasting"],
  },
  {
    term: "Futures cone",
    domain: "Futures",
    definition: "The diagram sorting futures into possible, plausible, probable and preferable — a widening cone from the present.",
    see: ["Preferred future"],
  },
  {
    term: "Limits to Growth",
    domain: "Futures",
    definition:
      "The 1972 Club of Rome study modelling growth against finite resources. Widely dismissed as failed prediction, though its standard run has tracked observed data more closely than its reputation suggests.",
    see: ["Systems thinking"],
  },
  {
    term: "Long Now",
    domain: "Futures",
    definition: "Stewart Brand and colleagues' project to lengthen the horizon of cultural attention, best known for the 10,000-year clock.",
  },
];
