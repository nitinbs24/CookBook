# ADR-0001: One React app, two interchangeable backends behind one API contract

## Status
Accepted

## Date
2026-10-31

## Context
Recipe Book is a college NoSQL assignment. One of its goals (PRD G3) is to show the same app running on two backend stacks, Express + Mongoose and FastAPI + Beanie, against one MongoDB. The frontend must work with either backend by changing one env value (`VITE_API_URL`), and the two must give identical responses (NFR-1).

## Decision
- One React + Vite frontend, one MongoDB database (`recipebook`), and two backends that implement the same `/api/v1` contract defined in `TRD.md` §6.
- Express listens on `:5000`, FastAPI on `:8000`. Both store identical documents (camelCase fields, the same references), so either backend can read data the other wrote.
- Build order: the Express backend and the full frontend first (the MERN stack), then the FastAPI port, which must pass the same contract tests (ADR-0004).
- Both backends use the same layering (routes → services → models, with controllers in Express only). Queries live only in services, so the FastAPI port is a line-by-line translation.

## Alternatives Considered

### Two separate apps (one frontend per backend)
- Pros: each stack can follow its own conventions.
- Cons: twice the frontend work; differences hide behind two UIs.
- Rejected: G3 needs one unchanged frontend.

### Backend-specific databases
- Pros: no risk of one backend writing a document the other can't read.
- Cons: the demo can't show both stacks against the same data.
- Rejected: one database is part of the brief, and the schema validator (ADR-0002) keeps both honest.

## Consequences
- The API contract is the main coupling point. Any change goes into `TRD.md` §6 and the contract suite first, then into both backends.
- Field-naming drift (snake_case from Python, `__v` or `_id` from Mongoose) is the main risk. It is handled by Mongoose `versionKey:false` / `_id:false`, Beanie camelCase aliases (ADR-0008), and the strict `$jsonSchema` validators.
- One JWT secret is shared by both backends, so a token from either works on the other (ADR-0006).
