import { configureStore } from "@reduxjs/toolkit";
import dailyWorkflowReducer from "./slices/workFlow";

export const store = configureStore({
  reducer: {
    workFlow: dailyWorkflowReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;