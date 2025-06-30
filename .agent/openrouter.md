# OPENROUTER API RESEARCH

Great, I’ll research how to integrate the OpenRouter API for your app. I’ll focus on how to:

- Retrieve and filter available models (e.g., top picks, new additions, searchable list)
- Execute prompts with selected models
- Ensure judge models are handled separately from contestant models
- Format and organize prompt submission and response retrieval

I’ll also include any important considerations for dynamically building model-based workflows.
I’ll get back to you with everything you need to integrate OpenRouter into your web UI MVP.

# Building an AI Model Tournament with OpenRouter API

## Fetching Available Models and Metadata

To present an up-to-date list of AI models, you can use the OpenRouter Models API. OpenRouter provides a **public** endpoint `GET https://openrouter.ai/api/v1/models` that returns a JSON list of all available models and their metadata. Each model entry includes important fields such as:

- **`id`** – the unique model identifier used for API calls (this includes the provider prefix, e.g. `"google/gemini-2.5-pro-preview"` for Google’s Gemini model). The provider is the part before the slash in the `id` (e.g. `"google"` in this example).
- **`name`** – a human-friendly name for display.
- **`description`** – a detailed description of the model’s capabilities.
- **`created`** – a Unix timestamp (in seconds) of when the model was added to OpenRouter. This represents the "added date" and will be used to identify new models.
- Other fields like **`context_length`**, pricing info, supported parameters, etc., which you can use as needed.

**Example – Fetching the model list (Python):**

```python
import requests, datetime

# Fetch all models from OpenRouter API
url = "https://openrouter.ai/api/v1/models"
response = requests.get(url)  # No auth needed for model list (public info)
models_data = response.json()["data"]

# Example: print basic info for first 3 models
for model in models_data[:3]:
    model_id = model["id"]               # e.g. "openai/gpt-4" or "google/gemini-2.5-pro-preview"
    provider = model_id.split("/")[0]    # e.g. "openai" or "google"
    name = model["name"]                 # e.g. "GPT-4" or "Gemini 2.5 Pro Preview"
    added_date = datetime.datetime.utcfromtimestamp(model["created"])
    description = model["description"]
    print(f"{provider} – {name} (Added {added_date.date()}): {description[:60]}...")
```

This API-driven approach ensures your app always has the latest models. In fact, developers have noted the importance of dynamically populating model lists to catch new additions and avoid stale entries. By integrating with OpenRouter’s model API, _“the model list \[can] update whenever OpenRouter adds new models, eliminating manual updates”_.

You can also support **search and filtering** on this model list. For example, you might allow users to type keywords to filter by model name or provider. The OpenRouter API itself supports filtering by category (e.g. programming, roleplay) if you add a query param, but often it's simplest to fetch all models and then filter on your side. You could categorize or tag models by provider or capabilities using the metadata (for instance, filtering the `supported_parameters` field to find models supporting a feature, or using the `provider` portion of the ID to filter by vendor).

### Highlighting “Top Picks” and New Models

You may want to highlight certain models in the UI: for example, a curated list of "top picks" and a badge for newly added models. **Top picks** can be handled by maintaining a set of preferred model IDs (or criteria like high popularity). For instance, you might predefine a list of recommended model IDs in your system and then mark those in the fetched list as “⭐ Top Pick”. (OpenRouter’s API does not directly label top models, though the website does allow sorting by “Top Weekly” usage.)

For **new models**, you can use the `created` timestamp provided for each model. By comparing this timestamp to the current date, you can label models added recently. For example, you might decide any model added in the last 30 days gets a “NEW” tag in the UI. In code, this could be as simple as:

```python
import time
NOW = time.time()
NEW_THRESHOLD_DAYS = 30
for model in models_data:
    # Mark as new if added within the last 30 days
    if NOW - model["created"] < NEW_THRESHOLD_DAYS * 24 * 3600:
        model["is_new"] = True
```

This way, when rendering the model list, you can highlight those with `is_new=True`. OpenRouter’s own site implicitly uses the `created` field to sort models by newest, so using a time threshold is reasonable. You can adjust the threshold (e.g. last 7 days for “new”) as needed.

## Selecting Contestant Models and a Judge Model

In your application, users will create a **prompt-based challenge** and then select 4, 8, or 16 models to compete. You’ll present the list of models (with top picks and new labels as above) and allow multi-select up to the desired bracket size. Separately, the user will choose a **judge model**. The judge model should **not** be one of the contestants – ensure the user cannot select the same model in both lists. This can be enforced in the UI (e.g. remove the chosen judge from the contestants list, or vice-versa) or in backend validation before running the tournament.

When choosing a judge, it’s wise to pick a model known for strong reasoning or consistency (for example, GPT-4 might be a good judge for a complex prompt). Your system might guide the user to pick a high-quality model as judge, but ultimately any model (other than the contestants) can serve that role.

## Generating a "Judge Prompt" (Evaluation Criteria)

Before running the tournament, your app will generate a **judge prompt** – essentially the instructions that tell the judge _how_ to evaluate the answers. You mentioned automatically creating this via AI and letting the user edit it. One way to do this is to use one of the powerful models (perhaps the judge model itself or another strong model) to draft an evaluation prompt. For example, you could prompt an AI model with something like:

> _“Given the user prompt: '{challenge_prompt}', write a brief set of instructions for a judge to decide which of two answers is better. Mention criteria like accuracy, relevance, clarity, etc.”_

Using the OpenRouter API, you’d send this as a prompt to a model and get back a generated judge instructions text. The user can then refine this text if needed. This step uses the same API mechanics as any other prompt (see next section), just with a prompt designed to produce an evaluation guide. The result might be a sentence or paragraph such as: _“Judge the answers based on correctness, level of detail, and clarity. Provide an explanation and declare which answer is better.”_ The user can edit this before finalizing the tournament.

## Prompting the Models for Responses

Once the tournament setup is ready (challenge prompt, selected models, judge model, judge prompt), the backend will query each contestant model to get its response to the challenge prompt. OpenRouter’s API for generating completions is very similar to OpenAI’s Chat API. You will call the **Chat Completions** endpoint for each model: `POST https://openrouter.ai/api/v1/chat/completions` with the appropriate headers and JSON body.

Each request should include your **API key** in the `Authorization` header (`Bearer <YOUR_API_KEY>`), and the JSON payload should specify the model and the prompt. The prompt can be given as a conversation (with a list of `messages`) or as a direct text prompt. It’s recommended to use the chat format for compatibility. For example, to ask a model to answer the user’s challenge question, your request JSON might look like:

```json
{
  "model": "openai/gpt-4",
  "messages": [{ "role": "user", "content": "<challenge question text here>" }]
}
```

In code, using Python and `requests` library, this would be:

```python
api_url = "https://openrouter.ai/api/v1/chat/completions"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
prompt_message = {"role": "user", "content": challenge_prompt}
for model_id in selected_models:
    payload = {"model": model_id, "messages": [prompt_message]}
    resp = requests.post(api_url, headers=headers, json=payload)
    result = resp.json()
    answer = result["choices"][0]["message"]["content"]
    store_model_answer(model_id, answer)  # save the answer for later use
```

Each model’s `id` (from the list you fetched) already includes the provider prefix, which is required in the API call. Ensure you use that full ID string in the `"model"` field. (OpenRouter notes that you must _“include the organization prefix”_ when specifying the model in requests.) For example, use `"anthropic/claude-2"` rather than just `"claude-2"`. The OpenRouter API will route the call to the proper provider automatically.

**Making multiple calls in parallel:** If you have many models (e.g. 16) to call, you might want to run these requests concurrently to improve performance. OpenRouter does **not** support a single request for multiple models (there’s no batch API for querying several models at once). In fact, attempts to manually batch prompts (e.g. by concatenating multiple questions into one call) lead to mismatched results. The correct approach is to issue a separate API call for each model’s response. Given that you’re using an admin API key and don’t need to worry about strict rate limits, you can safely perform these calls in parallel (within reason).

For instance, if your backend is Node.js, you could use `Promise.all` to send requests to all selected models simultaneously. In Python, you could use `asyncio` or threading to dispatch all requests at once. OpenRouter’s infrastructure can handle concurrent requests and will automatically utilize available capacity for each model. Just be sure to collect all the responses before proceeding to the judging phase.

**Note:** The OpenRouter completion response is structured similarly to OpenAI’s. You will receive a JSON with a `choices` list, where typically `result["choices"][0]["message"]["content"]` contains the model’s answer text. Make sure to handle any possible errors or non-standard responses. For example, if a model fails or returns an error message, you might decide how to handle that (skip that model, or treat that as an empty entry).

## Evaluating Responses with the Judge Model

After obtaining responses from all contestant models, you will run the **tournament bracket** by having the judge model evaluate pairs of answers. The bracket setup could be single-elimination: in the first round, pair up the models (4 matchups if 8 models, etc.), then the winners move on to the next round, and so forth until a final winner is decided.

For each **matchup**, you need to prompt the judge model with the two answers and the judging criteria. Essentially, the judge model will be asked: _“Here are two answers to the same prompt – which is better according to the given criteria?”_ The prompt to the judge should include:

- The original question or challenge prompt (so the judge knows what was asked).
- The two answers to compare (perhaps labeled "Answer A" and "Answer B" or by model name if you prefer, though you might keep them anonymous as A vs B to avoid bias).
- The **judge prompt** instructions that describe how to decide the winner (the criteria generated or provided earlier).

**Example – Prompt for Judge model:** Suppose the challenge prompt was _“Explain the theory of relativity in simple terms.”_ and you have two model responses `answer_A` and `answer_B`. Also assume the judge instructions say _“Decide which answer is more accurate and easy to understand, and explain your reasoning. Finally, name the winner.”_ You could construct a single prompt message like:

```
"You are a judge comparing two answers to the question: 'Explain the theory of relativity in simple terms.'

Answer A: <text of answer_A>

Answer B: <text of answer_B>

<<Judge Instructions>>: Using the criteria of accuracy and clarity, explain which answer is better and **declare the winner** (Answer A or Answer B)."
```

You might format the prompt with newlines and clear separators exactly as above. This entire text can be put into a single `"content"` for a user role message, or you might split it into a system message (for instructions) plus a user message (for the content to evaluate). For simplicity, one message containing all the info is usually fine. The key is that the judge model receives a prompt that has all necessary context to make a decision.

Now, using the OpenRouter API, call the **judge model** with this prompt in the same way as before. For example:

```python
judge_id = judge_model_id  # (ensure this was not in contestants)
for round_no, matchup in enumerate(bracket_rounds, start=1):
    winners = []
    for (modelA, modelB) in matchup:  # each matchup is a pair of model IDs
        answerA = get_saved_answer(modelA)
        answerB = get_saved_answer(modelB)
        judge_input = (
            f"Question: {challenge_prompt}\n\n"
            f"Answer A:\n{answerA}\n\n"
            f"Answer B:\n{answerB}\n\n"
            f"{judge_prompt}\n"
        )
        payload = {"model": judge_id, "messages": [ {"role": "user", "content": judge_input} ]}
        resp = requests.post(api_url, headers=headers, json=payload)
        decision = resp.json()["choices"][0]["message"]["content"]
        # Parse the judge's decision to see who won:
        winner = parse_winner_from(decision)  # implement this to extract "A" or "B"
        winners.append(winner == "A" and modelA or modelB)
        save_judgement(round_no, modelA, modelB, decision)  # store judge's explanation
    # prepare next round bracket with winners...
```

Here, `bracket_rounds` would be a list of pairings for each round (you can generate this easily since the number of models is fixed to 4, 8, or 16). The code snippet shows iterating through each matchup, sending the combined prompt to the judge model, and then determining which model won based on the judge’s output.

**Interpreting the judge’s output:** The judge model will likely return a text explanation. Ideally, you instructed it to clearly state the winner (e.g. “**Winner: Answer B** because ...”). You can then parse the text to find whether it chose A or B. For reliability, you might enforce a format: for instance, you could append a request like _“Reply with ‘Answer A wins’ or ‘Answer B wins’ at the start of your answer.”_ If the judge model supports function calling or structured outputs, you could use those features, but a simpler approach is to parse keywords.

Make sure the judge model itself is **not one of the contestants** (to maintain fairness). Also, each matchup is judged independently; you can run all matchups in a round in parallel as well, since they are independent calls to the judge. After each round, you’ll have a list of winners (model IDs that advance). Then you form the next round’s pairings and repeat until you have the final winner.

Throughout this process, you can log or store the judge’s explanations for each match. This not only provides transparency (users can see _why_ a particular model won) but also creates content for the public tournament page.

## Managing API Calls Efficiently

Given that an admin API key will be used, you don't have to worry about strict rate limits or quotas in the traditional sense. However, efficiency and good practices are still important:

- **Reuse the model list wisely:** The model list from OpenRouter is fairly static and cached. You might fetch it once at application startup or cache it for some time (e.g. refresh it every few hours or daily) rather than on every user request. This ensures your dropdowns are always current without adding unnecessary latency for each user. If you need real-time updates (for instance, to mark a model “new” only for a short window), you could periodically refresh in the background. The OpenRouter model data is freely accessible and updated as soon as new models are confirmed.

- **Parallelize where appropriate:** As discussed, you can send out multiple model prompts concurrently to speed up tournament execution. For 8 or 16 models, doing these in parallel can drastically reduce waiting time. The same goes for judging multiple pairs in the first round – an admin key with ample capacity can handle it. OpenRouter’s global infrastructure will route each request to the appropriate provider and model instance. Just be cautious not to spawn an unbounded number of threads; sending 8 or 16 requests at once is fine, but hundreds at once might trigger Cloudflare’s DDoS protections if it ever came to that. In this use case, that shouldn’t be a concern.

- **Error handling:** Even with an admin key, individual model calls can fail or return errors (e.g., a provider could be temporarily unavailable). The OpenRouter API will return an error code and message in those cases. Your backend should handle this gracefully – for example, if a model fails to return an answer, you might retry once or mark that model’s answer as unavailable. Since it’s a tournament, you could even default a failing model to “lose” by forfeit (with a note that it failed to respond). Also, ensure the judge model’s outputs are handled carefully; if the judge returns an unexpected format, you might need a fallback method or manual review.

- **Distinct judge enforcement:** Double-check before execution that the judge model ID is not in the list of contestant model IDs. This can be a simple assertion in code. It prevents a scenario where the judge would effectively be evaluating its own answer (which could be biased or nonsensical in context).

- **API usage and costs:** With an admin key, you likely have a high or unlimited quota, but do consider the **cost** of each call, especially if using expensive models. OpenRouter provides pricing info for models in the metadata (in the `pricing` field). For instance, GPT-4 will cost more per token than smaller models. Running a 16-model tournament with a GPT-4 judge could use a lot of tokens (16 answers + multiple rounds of judging). If cost is a factor, you might limit certain expensive models or use them sparingly. Since your question says no rate limits to consider, this may be under control, but it’s worth noting for a production environment.

## Persisting and Sharing Tournament Results

Once a tournament is run, you’ll want to make the results viewable via a static link and allow versioning and forking. Here’s how you can approach these features:

- **Public Link to Tournament:** When a user creates a tournament, you can assign it a unique identifier (e.g. a UUID or an incrementing ID, or a slug based on the title). After running the tournament, store all relevant data in a database or file (the challenge prompt, the list of participating model IDs, the judge model and prompt, all model responses, and each judge decision with the final winner). Then serve this at a route like `/tournaments/<tournament_id>`. Anyone with the link can view the bracket, the answers, and the outcome. Since the tournament data is static after generation, caching this page or data is easy. The link remains available for others to view the results.

- **Versioning (Re-running Tournaments):** If a creator wants to tweak something (say, change the prompt or add a new model) and re-run, you have a couple options:

  - **In-place Update:** You could allow them to “re-run” which updates the existing tournament entry with new results (and perhaps note the date of the latest run). In this case, consider keeping an archive of old results if possible, or at least the ability to view a previous run (to see how results changed).
  - **New Version Entry:** Alternatively, treat a re-run as a new tournament entry that is linked to the original. For example, the original tournament ID 123 could spawn a new entry 123-v2 (version 2) with the modified setup and new results. The UI could indicate that there are multiple versions of the same base tournament. This preserves the history of how the tournament evolved.
  - At minimum, store a version number or timestamp of run with each result. This way, the creator (and viewers) know if what they’re seeing is the first run or an updated run. Versioning is particularly relevant because AI model responses can vary from run to run (especially if temperature or non-determinism is involved). Rerunning the same tournament could yield a different bracket outcome on a different day or after prompt adjustments.

- **Forking Tournaments:** Forking allows a user to take someone else’s tournament setup and create their own variant. Implementation-wise, this means providing a way to duplicate the configuration of an existing tournament into a new creation form. For example, if someone likes tournament #123, they click "Fork", and your app pre-fills a new tournament form with the same prompt and model selections (perhaps not copying the results, just the setup). The user can then maybe change a few models or edit the prompt and run their own version. Under the hood, you’d create a new tournament entry with a reference to the original (you could note “forked from ID 123”). This is similar to how one might fork a project or a coding sandbox – it jumpstarts the user with existing settings. Just ensure that when they run the forked tournament, it gets a fresh ID/link and does not overwrite the original, obviously.

All these features (public link, versions, forks) entail designing your data storage and UI to handle multiple tournament records. A possible schema is to have a **Tournament** record with fields like `id`, `prompt`, `models_list`, `judge_model`, `judge_prompt`, `created_by`, `timestamp` etc. For results, you might have a separate **TournamentResult** record that links to Tournament (with round-by-round outcomes, winner, etc.) and possibly a version number. For a re-run, you could either update the TournamentResult (if keeping one record per tournament) or create a new TournamentResult with an incremented version. Forks could be new Tournament entries that have a `parent_id` pointing to the original they copied from.

## Code-Level Considerations and Example Summary

Bringing it all together, here’s a high-level summary of the backend logic in steps, with references to code snippets from above:

1. **Load Model List:** On startup (or on demand), fetch the models from OpenRouter API. Parse out fields needed (id, name, description, created, etc.). Mark any special flags (new/top picks). _This populates the model selection UI._
   _– _(Refer to the Python snippet under “Fetching Available Models” for how to call the API and parse results.)_ –_

2. **User Selection:** The user chooses N models for the tournament and a separate judge model. Enforce that the judge is not among the N. Possibly generate the judge prompt via an AI call here.
   _– _(Use an OpenRouter call similar to step 1, but to a chosen model with a prompt that asks for judging instructions.)_ –_

3. **Gather Responses from Models:** For each selected model, call the OpenRouter completions API with the user's challenge prompt. Use the model’s `id` in the request JSON. These calls can be done in parallel to reduce wait time (since there’s no batch request support, you issue one request per model). Collect all the responses.
   _– _(Refer to the code snippet under “Prompting the Models” for constructing the request. The OpenRouter example shows the required headers and JSON structure.)_ –_

4. **Run Tournament Bracket:** Organize the model responses into a bracket. For each matchup, call the judge model via OpenRouter with a combined prompt containing both answers and the judge instructions. The judge model’s call is made just like the others, specifying the judge’s model ID and a message with the two answers. Retrieve the judge’s decision and determine the winner. Proceed to the next round until one winner remains.
   _– _(See the pseudocode in “Evaluating Responses with the Judge Model” for how to form the judge prompt and iterate through rounds. Construct the judge payload by including the challenge, both answers, and instructions, then send it to OpenRouter.)_ –_

5. **Display and Store Results:** Once completed, save the results (answers, judge decisions, winner) and present the bracket outcomes to the user. Generate a public link for others to view. Implement any versioning or forking logic as discussed if the user wants to run it again or if someone else wants to copy it.

Throughout these steps, the OpenRouter API is doing the heavy lifting for generating text. By leveraging it, your application can support **hundreds of models** (since OpenRouter aggregates many providers behind one API). When specifying the model in requests, remember to use the full identifier including provider prefix (e.g. `"openai/gpt-4"` or `"ai21/j2-jumbo-instruct"`), as listed from the model fetch step. The good news is OpenRouter normalizes the API, so the request/response format is consistent across models – you don't have to worry about different payload formats for different providers.

In summary, using the OpenRouter API allows your “AI Tournament” app to dynamically stay updated with available models and run complex multi-model workflows (parallel prompting and AI evaluation) with relative ease. By carefully structuring your prompts and managing the sequence of API calls, you can automate a tournament bracket where AI models compete and another AI model judges them. With proper backend design (caching model data, parallelizing calls, and storing results), the system will be efficient and scalable. Good luck with building this innovative tournament application!

**Sources:**

- OpenRouter Documentation – _Models API and schema_, _fetching model list example_, _usage of chat completions endpoint_.
- Stack Overflow – _OpenRouter does not support batch inference; separate calls per prompt are needed_.
