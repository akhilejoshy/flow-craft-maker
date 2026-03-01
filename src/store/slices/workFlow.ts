import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { api } from "@/services/EventServices";


export interface WorkflowBlock {
    id: string;
    startTime: string;
    endTime: string;
    subtask: string;
    type: "existing";
}

export interface Subtask {
    id: string;
    name: string;
}

export interface DailyWorkflowResponse {
    date: string;
    total_work_time: string;
    workflow: WorkflowBlock[];
}

interface DailyWorkflowState {
    workflow: WorkflowBlock[];
    subtasks: Subtask[];
    date: string | null;
    totalWorkTime: string | null;

    workflowLoading: boolean;
    activityLoading: boolean;

    error: string | null;
    activityPeriod: number | null;
    taskActivities: TaskActivity[];
}


export interface ActivityPayload {
  work_diary_id: number;
  task_activity_id: number;
  keyboard_action: number;
  mouse_action: number;
  start_time: string;
  end_time: string;
}

const initialState: DailyWorkflowState = {
    workflow: [],
    subtasks: [],
    date: null,
    totalWorkTime: null,

    workflowLoading: false,
    activityLoading: false,

    error: null,
    activityPeriod: null,
    taskActivities: [],
};

export interface TaskActivity {
    id: number;
    work_diary_id: number;
    sub_task_id: number;
    subtask_name: string;
    project_name: string;
    start_time: string;
    total_time: string;
    description: string;
    activities: any;
    total_time_spent: string;
}

function extractTime(iso: string): string {
    return new Date(iso).toTimeString().split(" ")[0]; // HH:mm:ss
}


export const fetchDailyWorkflow = createAsyncThunk(
    "dailyWorkflow/fetch",
    async (date: string, { rejectWithValue }) => {
        try {
            const userId = localStorage.getItem("userId");
            // const userId = 2

            const url = `/api/v1/user/${userId}/daily_workflow?date=${date}`;

            const response = await api.getEvents(url);


            const cleanedWorkflow: WorkflowBlock[] =
                response.data.response.workflow.map(
                    (item: any, index: number) => ({
                        id: `${item.start_time}-${item.end_time}-${index}`,
                        startTime: extractTime(item.start_time),
                        endTime: extractTime(item.end_time),
                        subtask: item.subtask_name,
                        type: "existing",
                    })
                );
            const subtasksMap = new Map<string, Subtask>();

            response.data.response.workflow.forEach((item: any) => {
                subtasksMap.set(String(item.sub_task_id), {
                    id: String(item.sub_task_id),
                    name: item.subtask_name,
                });
            });

            const subtasks: Subtask[] = Array.from(subtasksMap.values());
            return {
                workflow: cleanedWorkflow,
                subtasks,
                date: response.data.response.date,
                totalWorkTime: response.data.response.total_work_time,
            };

        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                return rejectWithValue(
                    error.response?.data || "Failed to fetch daily workflow"
                );
            }
            return rejectWithValue("Unexpected error while fetching workflow.");
        }
    }
);

export const fetchActivityPeriod = createAsyncThunk(
    "dailyWorkflow/fetchActivityPeriod",
    async (date: string, { rejectWithValue }) => {
        try {
            const userId = localStorage.getItem("userId");
            // const userId = 2;
            const url = `/api/v1/employee/${userId}/agent?date=${date}`;
            const response = await api.getEvents(url);
            const data = response.data.data;
            return {
                activityPeriod: data.activity_period,
                taskActivities: data.task_activities,
            };

        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                return rejectWithValue(
                    error.response?.data || "Failed to fetch activity period"
                );
            }
            return rejectWithValue(
                "Unexpected error while fetching activity period."
            );
        }
    }
);


export const submitActivity = createAsyncThunk<
    any,
    FormData,
    { rejectValue: string }
>(
    "projects/submitActivity",
    async (formData, { rejectWithValue }) => {
        try {
            const assigneeId = localStorage.getItem("userId");
            // const assigneeId = 2
            const url = `/api/v1/employee/${assigneeId}/agent/activity`;
            const response = await api.postEvents(url, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return response.data
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                return rejectWithValue(
                    error.response?.data?.error || "Failed to post activity"
                );
            }
            return rejectWithValue("Unexpected error while posting activity");
        }
    }
);

const dailyWorkflowSlice = createSlice({
    name: "dailyWorkflow",
    initialState,
    reducers: {
        clearWorkflow: (state) => {
            state.workflow = [];
            state.subtasks = [];
            state.date = null;
            state.totalWorkTime = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder

            // ---- DAILY WORKFLOW ----
            .addCase(fetchDailyWorkflow.pending, (state) => {
                state.workflowLoading = true;
                state.error = null;
            })
            .addCase(fetchDailyWorkflow.fulfilled, (state, action) => {
                state.workflowLoading = false;
                state.workflow = action.payload.workflow;
                state.subtasks = action.payload.subtasks;
                state.date = action.payload.date;
                state.totalWorkTime = action.payload.totalWorkTime;
            })
            .addCase(fetchDailyWorkflow.rejected, (state, action) => {
                state.workflowLoading = false;
                state.error = action.payload as string;
            })

            // ---- ACTIVITY PERIOD ----
            .addCase(fetchActivityPeriod.pending, (state) => {
                state.activityLoading = true;
                state.error = null;
            })
            .addCase(fetchActivityPeriod.fulfilled, (state, action) => {
                state.activityLoading = false;
                state.activityPeriod = action.payload.activityPeriod;
                state.taskActivities = action.payload.taskActivities;
            })
            .addCase(fetchActivityPeriod.rejected, (state, action) => {
                state.activityLoading = false;
                state.error = action.payload as string;
            })
            // ---- POST ACTIVITY ----
            .addCase(submitActivity.pending, (state) => {
                state.activityLoading = true;
                state.error = null;
            })
            .addCase(submitActivity.fulfilled, (state, action) => {
                state.activityLoading = false;
                // optional: you can push result into an array if needed
            })
            .addCase(submitActivity.rejected, (state, action) => {
                state.activityLoading = false;
                state.error = action.payload || "Failed to post activity";
            });
    }
});

export const { clearWorkflow } = dailyWorkflowSlice.actions;
export default dailyWorkflowSlice.reducer;