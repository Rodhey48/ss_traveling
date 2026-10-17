import api from '@/lib/axiosClient';
import type {
  BaseResponse,
  Agent,
  AgentFormData,
  AgentType,
  AgentCommissionRule,
  AgentCommissionRuleFormData,
  CalculatedCommissionResult,
} from '@/types';

export const AgentService = {
  findAll: async (params?: {
    agentType?: AgentType;
    city?: string;
    isActive?: boolean | string;
    search?: string;
  }): Promise<BaseResponse<Agent[]>> => {
    const response = await api.get<BaseResponse<Agent[]>>('api/v1/agents', { params });
    return response.data;
  },

  findAgentsByRoute: async (
    origin: string,
    destination?: string,
  ): Promise<BaseResponse<Agent[]>> => {
    const response = await api.get<BaseResponse<Agent[]>>('api/v1/agents/by-route', {
      params: { origin, destination },
    });
    return response.data;
  },

  findOne: async (id: string): Promise<BaseResponse<Agent>> => {
    const response = await api.get<BaseResponse<Agent>>(`api/v1/agents/${id}`);
    return response.data;
  },

  create: async (data: AgentFormData): Promise<BaseResponse<Agent>> => {
    const response = await api.post<BaseResponse<Agent>>('api/v1/agents', data);
    return response.data;
  },

  update: async (id: string, data: Partial<AgentFormData>): Promise<BaseResponse<Agent>> => {
    const response = await api.put<BaseResponse<Agent>>(`api/v1/agents/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<BaseResponse<{ success: boolean; message: string }>> => {
    const response = await api.delete<BaseResponse<{ success: boolean; message: string }>>(
      `api/v1/agents/${id}`,
    );
    return response.data;
  },

  // Commission Rules
  findRulesByAgent: async (agentId: string): Promise<BaseResponse<AgentCommissionRule[]>> => {
    const response = await api.get<BaseResponse<AgentCommissionRule[]>>(
      `api/v1/agents/${agentId}/commission-rules`,
    );
    return response.data;
  },

  createCommissionRule: async (
    agentId: string,
    data: AgentCommissionRuleFormData,
  ): Promise<BaseResponse<AgentCommissionRule>> => {
    const response = await api.post<BaseResponse<AgentCommissionRule>>(
      `api/v1/agents/${agentId}/commission-rules`,
      data,
    );
    return response.data;
  },

  updateCommissionRule: async (
    ruleId: string,
    data: Partial<AgentCommissionRuleFormData>,
  ): Promise<BaseResponse<AgentCommissionRule>> => {
    const response = await api.put<BaseResponse<AgentCommissionRule>>(
      `api/v1/agents/commission-rules/${ruleId}`,
      data,
    );
    return response.data;
  },

  deleteCommissionRule: async (
    ruleId: string,
  ): Promise<BaseResponse<{ success: boolean; message: string }>> => {
    const response = await api.delete<BaseResponse<{ success: boolean; message: string }>>(
      `api/v1/agents/commission-rules/${ruleId}`,
    );
    return response.data;
  },

  // Commission Simulation
  calculateCommission: async (params: {
    agentId: string;
    seatClassId?: string;
    ticketPrice: number;
  }): Promise<BaseResponse<CalculatedCommissionResult>> => {
    const response = await api.get<BaseResponse<CalculatedCommissionResult>>(
      'api/v1/agents/calculate-commission',
      { params },
    );
    return response.data;
  },
};
