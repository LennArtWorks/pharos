# `/utils` - The Data Handlers (Logic)

This directory is strictly for **Pure Functions, Builders, and Formatters**.
It acts as the engine that processes data and applies the rules defined in `/config`.

### Rules for `/utils`:
1. **linked to /config:** Utils that reflect functions written for data from `/config` are placed into `/config`
2. **The Builder Pattern:** Utils take static templates from `/config`, clone them, inject dynamic runtime data (like User IDs, timestamps, or random colors), and return the finished object.
3. **Pure & Predictable:** Functions here should ideally take inputs and return outputs without causing side effects (like saving directly to a database). 
4. **Stateless:** A utility function should not store variables outside of its own scope. 

*Think of `/utils` as the construction workers. They read the blueprints from `/config` and assemble the actual objects used in the application.*