import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/data/queryKeys";
import { voiceKnowledgeRepository as repository } from "@/data/repositories/voiceKnowledge";
import { VoiceKnowledgeStatus } from "@/constants/voiceKnowledge";
export function useVoiceKnowledge() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: qk.voiceKnowledge(),
    queryFn: repository.list,
    refetchInterval: (query) =>
      query.state.data?.some(
        (d) => d.status === VoiceKnowledgeStatus.Processing,
      )
        ? 3000
        : false,
  });
  const mutation = useMutation({
    mutationFn: (action: () => Promise<unknown>) => action(),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: qk.voiceKnowledge() }),
  });
  return { query, mutation, actions: repository };
}
export function useVoiceUnanswered(from: string, to: string, enabled: boolean) {
  return useQuery({
    queryKey: qk.voiceUnanswered(from, to),
    queryFn: () => repository.unanswered(from, to),
    enabled,
  });
}
