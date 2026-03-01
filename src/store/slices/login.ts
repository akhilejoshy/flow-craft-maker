import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { api } from "@/services/EventServices";

interface LoginState {
  login: any;
  loading: boolean;
  error: string | null;
}

const initialState: LoginState = {
  login: null,
  loading: false,
  error: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (
    credentials: { email: string; password: string;loginType:string },
    { rejectWithValue }
  ) => {
    try {
      const url = `/api/v1/login`;
      const payload = {
        email: credentials.email,
        password: credentials.password,
        login_type: credentials.loginType,
      };
      const response = await api.postEvents(url, payload, {
        headers: { "Content-Type": "application/json" },
      });
      const data = response.data;
      if (data.success && data.response?.id) {
        localStorage.setItem("userId", String(data.response.id));
        localStorage.setItem("employee", String(data.response.full_name));
        localStorage.setItem("email", String(data.response.email));
        localStorage.setItem("token", data.response.token);
        localStorage.setItem("userType", data.response.userType);
      }

      return data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data || "login failed");
      }
      return rejectWithValue("Unknown login error");
    }
  }
);

const loginSlice = createSlice({
  name: "adminLogin",
  initialState,
  reducers: {
    logout: (state) => {
      state.login = null;
      state.loading = false;
      state.error = null;
      localStorage.clear();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.login = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout } = loginSlice.actions;
export default loginSlice.reducer;
