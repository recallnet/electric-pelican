import { expectType } from "tsd";
import { typedApi } from "../src/lib/api-client";
import { ApiContracts } from "../src/contracts/api";

expectType<Promise<(typeof ApiContracts)["GET /api/models"]["response"]>>(
  typedApi("GET /api/models", {}),
);
