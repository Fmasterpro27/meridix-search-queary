# meridix-search-query

An experimental search suggestion API developed for **Meridix Browser v1.1.0-develop**.

> [!WARNING]
> This project is **experimental** and was never released to production as part of Meridix.

## About

`meridix-search-query` was developed as an experimental backend for search suggestions during the development of **Meridix v1.1.0-develop**.

The API combines suggestions from multiple sources into a single response, with results being deduplicated and ranked based on provider agreement and result position.

The experimental implementation uses:

* Google Suggest
* DuckDuckGo
* Wikipedia

## How it works

```text
Client
  │
  ▼
meridix-search-query
  │
  ├── Google Suggest
  ├── DuckDuckGo
  └── Wikipedia
  │
  ▼
Combine
  │
  ▼
Deduplicate & Rank
  │
  ▼
Return Suggestions
```

Responses are also cached using Cloudflare's edge cache to reduce repeated requests to upstream services.

## API

### `GET /suggest`

Returns search suggestions for a query.

Example:

```text
/suggest?q=github
```

Example response:

```json
{
  "query": "github",
  "suggestions": [
    "github",
    "github login",
    "github copilot"
  ]
}
```

## Meridix

This project was created and tested during development of **Meridix Browser v1.1.0-develop**.

However, the API **never made it into a production release of Meridix**. The implementation was replaced during development, and this repository is being released as an experimental project.

### Download Meridix

<a href="https://get.microsoft.com/installer/download/9n63cl88l49h?referrer=appbadge" target="_self">
  <img src="https://get.microsoft.com/images/en-us%20dark.svg" width="200"/>
</a>

## Project Status

**Experimental**

This repository is published for experimentation, learning, and reference.

It is not a production component of the current Meridix release.

## License

This project is licensed under the **Apache License 2.0**.

See [`LICENSE`](LICENSE) for the full license text.

## Disclaimer

`meridix-search-query` is an independent project and is **not affiliated with or endorsed by Google, DuckDuckGo, or Wikipedia**.

This project interacts with third-party services. Their availability, endpoints, response formats, and applicable terms may change independently of this project.

Users deploying or modifying this project are responsible for complying with the applicable terms and policies of the third-party services they use.
