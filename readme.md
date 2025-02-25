# ArogyaSetu

### We follow standard structure for this project

```
|--src
|   |--components
|       |--modules-name
|               |--module-name.controller.ts
|               |--module-name.error.ts
|               |--module-name.repository.ts
|               |--module-name.route.ts
|               |--module-name.schema.ts
|               |--module-name.token.ts
|               |--module-name.validate.ts
|       |++ new modules
|   |--config
|       |--application.config.ts
|   |--helpers
|       |--helper-file-name.helper.ts
|       |++ new helper files
|   |--migration
|   |--seed
|   |--services
|       |--service-name-with-large-assets
|               |--service-name.error.ts
|               |--service-name.route.ts
|               |--service-name.schema.ts
|               |--service-name.token.ts
|       |--service-name.ts // as normal single file service
|       |++ new service files
|--app.ts
|--config.ts
|--index.ts
|--types
|   |--types-module.d.ts
|.editorConfig
|.env
|.env-example
|.eslintrc
|.gitignore
|.prettierc
|package.json
|tsconfig.json
|++ new files here
```

-   Folder naming can be singular or plural, but should be standardized

### To start project:

-   Requirement :
    -   node version: 20.8.0
    -   typescript version: 5.2.2
-   Step-1 : npm i
-   Step-2 :
    -   npm run start:dev (development)
    -   npm run start:prod (production)
