import flwr as fl
from typing import List, Tuple, Optional, Dict
from flwr.common import Metrics

# 1. Custom Strategy for Clinical Rigor
class PharmacoEpiStrategy(fl.server.strategy.FedAvg):
    def aggregate_fit(
        self,
        server_round: int,
        results: List[Tuple[fl.server.client_proxy.ClientProxy, fl.common.FitRes]],
        failures: List[BaseException],
    ) -> Tuple[Optional[fl.common.Parameters], Dict[str, fl.common.Scalar]]:
        
        # Director-level logic: Only aggregate if we have enough clinical diversity
        if not results:
            return None, {}
        
        print(f"--- Round {server_round}: Aggregating safety signals from {len(results)} hospitals ---")
        
        # Call the base FedAvg logic to perform the weight averaging
        aggregated_parameters, aggregated_metrics = super().aggregate_fit(server_round, results, failures)

        if aggregated_parameters is not None:
            # Here you would typically save the global model to a 'Model Registry'
            print(f"Round {server_round} successful. Global model updated.")
            
        return aggregated_parameters, aggregated_metrics

# 2. Metric Aggregation (e.g., tracking Global Accuracy/AUC)
def weighted_average(metrics: List[Tuple[int, Metrics]]) -> Metrics:
    # Multiply accuracy of each hospital by number of examples (patients) it has
    accuracies = [num_examples * m["accuracy"] for num_examples, m in metrics]
    examples = [num_examples for num_examples, _ in metrics]

    # Aggregate and return the global weighted accuracy
    return {"accuracy": sum(accuracies) / sum(examples)}

# 3. Start the Orchestrator
if __name__ == "__main__":
    # Define the strategy
    strategy = PharmacoEpiStrategy(
        fraction_fit=1.0,             # Use 100% of available hospitals
        min_fit_clients=2,            # Minimum hospitals needed to start a round
        min_available_clients=2,      # Minimum hospitals that must be online
        evaluate_metrics_aggregation_fn=weighted_average,
    )

    print("Starting PharmaFederate Aggregator on port 8080...")
    fl.server.start_server(
        server_address="0.0.0.0:8080",
        config=fl.server.ServerConfig(num_rounds=5),
        strategy=strategy,
    )
