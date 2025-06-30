# Final AI Capability Taxonomy for ELO + Routing System

## Core Capability Tags

_Each model gets ELO score per tag_

### **Perception & Understanding**

| **L2 Family**              | **L3 Canonical Tags**                                                                                      |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Multimodal Integration** | `vision language reasoning` · `cross modal alignment` · `embodied perception` · `audio visual processing`  |
| **Visual Processing**      | `scene understanding` · `object detection` · `spatial reasoning` · `visual composition` · `image analysis` |
| **Language Comprehension** | `semantic understanding` · `pragmatic inference` · `multilingual processing` · `context interpretation`    |
| **Temporal Processing**    | `sequence modeling` · `temporal reasoning` · `long context understanding` · `pattern recognition`          |

### **Communication & Expression**

| **L2 Family**                 | **L3 Canonical Tags**                                                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Written Production**        | `formal writing` · `narrative generation` · `technical documentation` · `style adaptation` · `creative writing`                  |
| **Interactive Communication** | `dialogue management` · `audience adaptation` · `real time response` · `conversational flow`                                     |
| **Multimodal Expression**     | `vision language generation` · `multimedia synthesis` · `cross modal translation` · `integrated output`                          |
| **Cultural Communication**    | `cross cultural adaptation` · `localization` · `cultural sensitivity` · `language variation` · `cultural context interpretation` |
| **Persuasion & Influence**    | `persuasive argumentation` · `negotiation strategy` · `influence techniques` · `rhetorical effectiveness`                        |
| **Contextual Execution**      | `instruction following` · `task context integration` · `complex prompt handling` · `context preservation`                        |

### **Reasoning & Problem-Solving**

| **L2 Family**              | **L3 Canonical Tags**                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Logical Reasoning**      | `deductive inference` · `inductive reasoning` · `abductive reasoning` · `constraint satisfaction` · `formal logic` |
| **Quantitative Reasoning** | `mathematical computation` · `statistical analysis` · `numerical estimation` · `data interpretation`               |
| **Strategic Planning**     | `multi step planning` · `scenario analysis` · `resource optimization` · `goal decomposition`                       |
| **Causal Reasoning**       | `causal inference` · `counterfactual reasoning` · `mechanism understanding` · `cause effect modeling`              |
| **Abstract Reasoning**     | `analogical reasoning` · `conceptual thinking` · `pattern abstraction` · `symbolic manipulation`                   |

### **Knowledge & Learning**

| **L2 Family**             | **L3 Canonical Tags**                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Domain Expertise**      | `scientific knowledge` · `legal reasoning` · `historical analysis` · `medical knowledge` · `technical specialization`                      |
| **Financial & Economic**  | `financial markets` · `investment analysis` · `cryptocurrency blockchain` · `economic modeling` · `trading strategies` · `risk assessment` |
| **Knowledge Integration** | `cross domain synthesis` · `information synthesis` · `knowledge grounding` · `fact verification`                                           |
| **Adaptive Learning**     | `few shot learning` · `in context learning` · `continual adaptation` · `transfer learning`                                                 |
| **Memory & Retrieval**    | `information access` · `knowledge recall` · `semantic search` · `context retrieval`                                                        |

### **Creativity & Innovation**

| **L2 Family**           | **L3 Canonical Tags**                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Creative Generation** | `artistic creation` · `novel ideation` · `conceptual blending` · `imaginative reasoning` · `creative problem solving` |
| **Design & Synthesis**  | `system design` · `visual design` · `conceptual design` · `innovation workflows` · `aesthetic judgment`               |
| **Pattern Discovery**   | `trend identification` · `insight generation` · `creative connections` · `emergent pattern detection`                 |

### **Technical Implementation**

| **L2 Family**         | **L3 Canonical Tags**                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Code & Systems**    | `algorithm implementation` · `software architecture` · `system integration` · `debugging` · `code optimization` |
| **Data Processing**   | `data analysis` · `statistical modeling` · `pipeline development` · `data transformation`                       |
| **Tool Integration**  | `api usage` · `workflow automation` · `system interoperability` · `external tool usage`                         |
| **Format Generation** | `structured output` · `markup generation` · `data serialization` · `format conversion`                          |

## Future Extensions

_Safety & Robustness Dimensions will be added in future versions_

## Usage in ELO + Routing System

### **Model Scoring Example**

```json
{
  "model_id": "claude-4-sonnet",
  "capability_elos": {
    "vision language reasoning": 1847,
    "creative writing": 1923,
    "algorithm implementation": 1756,
    "instruction following": 1891,
    "cross modal translation": 1834
  }
}
```

### **Router Query Example**

```
User prompt: "Write a poem about space and create an SVG visualization"

Router decomposition:
1. Subtask: "Write poem about space"
   → Required: creative writing, narrative generation
   → Best model: Model A (ELO: 1923)

2. Subtask: "Create SVG from poem"
   → Required: vision language reasoning, algorithm implementation, instruction following
   → Best model: Model B (combined ELO score highest)
```

## Implementation Notes

### **Tag Selection Principles**

- **Mutually Exclusive**: Each tag represents distinct capability
- **Collectively Exhaustive**: Covers all meaningful AI capabilities
- **Benchmark Mappable**: Aligns with MMLU, HELM, BigBench categories
- **Router Friendly**: Clear skill-to-tag mapping for task decomposition

### **ELO Calculation**

- Each tag gets independent ELO score based on head-to-head evaluations
- Regular tournaments across models for each capability

### **Evolution Strategy**

- Quarterly review for new capability gaps
- Annual major version updates
- Backward compatibility maintained via tag aliases
- Community feedback integration through GitHub-style process

## Total Tag Count: 95 Core Capability Tags

- **Perception & Understanding**: 16 tags
- **Communication & Expression**: 25 tags
- **Reasoning & Problem-Solving**: 17 tags
- **Knowledge & Learning**: 18 tags
- **Creativity & Innovation**: 9 tags
- **Technical Implementation**: 10 tags
