import create from "zustand";
import { api } from "@/lib/api";

export const useAppStore = create((set, get) => ({
  auth: { token: null, user: null, profile: null },
  pets: [],
  events: [],
  loading: false,
  error: null,

  setAuth: (auth) => set({ auth }),

  fetchPets: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`/pets`, { params });
      set({ pets: res.data.pets || [], loading: false });
      return res.data.pets || [];
    } catch (err) {
      set({ error: err, loading: false });
      throw err;
    }
  },

  addPet: async (formData) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post(`/pets`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // optimistic update
      set((state) => ({ pets: [res.data.pet, ...state.pets], loading: false }));
      return res.data.pet;
    } catch (err) {
      set({ error: err, loading: false });
      throw err;
    }
  },
}));

export default useAppStore;
