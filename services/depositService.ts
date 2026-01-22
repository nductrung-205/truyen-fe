// services/depositService.ts
import axios from 'axios';

const API_URL = 'http://192.168.1.11:8080/api/deposit';

export interface DepositPackage {
  amount: number;
  coins: number;
  bonus: number;
}

export const depositService = {
  async createDeposit(packageData: DepositPackage) {
    const response = await axios.post(`${API_URL}/create`, packageData);
    return response.data;
  },

  async confirmDeposit(transactionId: string) {
    const response = await axios.post(`${API_URL}/confirm/${transactionId}`);
    return response.data;
  },
};