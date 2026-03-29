# `/config` - The Source of Truth (Data Storage)

This directory is strictly for **Static Data, Blueprints, and Constants**. 
It acts as the DNA of the application. 

### Rules for `/config`:
1. **No Logic:** Do not write functions that compute or fetch runtime data here.
2. **Static Templates:** If a JSON file needs to be saved to the cloud, its exact empty structure (Template) lives here.
3. **Global Constants:** Things like `SYSTEM_CONFIG` (hidden prefixes, config folder names) and `GLOBAL_SETTINGS` (debounce times, dev accounts) belong here.
4. **Permissions Blueprint:** The literal string definitions of permissions (`files.edit`, `system.*`) live here.

*Think of `/config` as the architectural blueprints. You can look at them to see exactly how a building is shaped, but they don't build the building.*