using lib;
using System.Diagnostics;

// Класс эксперимента
public class Experiment
{
    private readonly ExperimentParameters _parameters;

    int nodesAmount;
    double maxDistance;
    double[,] matrix;
    TSPConfig config;
    TSPSolver solver;
    long epochs;
    TSPPath bestPath;
    string best;

    public int NodesAmount
    {
        set { nodesAmount = value; }
        get { return nodesAmount; }
    }

    public double[,] Matrix
    {
        set { }
        get { return matrix; }
    }

    public TSPConfig Config
    {
        set { }
        get { return config; }
    }

    public long Epochs
    {
        set { }
        get { return epochs; }
    }

    public string Best
    {
        set { }
        get
        {
            string s = "0->";
            for (int i = 0; i < bestPath.Genes.Length; i++)
            {
                s += bestPath.Genes[i].ToString() + "->";
            }
            return s += "0";
        }
    }

    public double FScore
    { 
        set { }
        get { return bestPath.FScore; }
    }

    public Experiment(ExperimentParameters parameters)
    {
        nodesAmount = parameters.NodesAmount;

        maxDistance = 100;
        matrix = TSPMatrix.Generate(nodesAmount, (int)maxDistance);

        config = new();
        config.Epochs = parameters.Epochs;
        config.PopulationSize = parameters.PopulationSize;
        config.MutationProbability = parameters.MutationProbability;
        config.CrossoverProbability = parameters.CrossoverProbability;
        config.SurvivorsPart = parameters.SurvivorsPart;

        solver = new(nodesAmount, matrix, config);
        bestPath = (TSPPath)solver.Best;
        epochs = 0;
    }

    public object RunStep()
    {
        solver.Evolve();
        epochs++;
        bestPath = (TSPPath)solver.Best;
        return new
        {
            epochs,
            fScore = bestPath.FScore,
            Best
        };
    }
}
public static class ExperimentStore
{
    public static Dictionary<Guid, Experiment> Experiments { get; } = new();
    public static readonly Dictionary<Guid, CancellationTokenSource> EvolutionTokens = new();
    public static readonly object _lock = new();

    public static bool GetExperiments(Guid id, out Experiment exp)
    {
        lock (_lock)
        {
            return Experiments.TryGetValue(id, out exp);
        }
    }

    public static bool GetEvolutionTokens(Guid id)
    {
        lock (_lock)
        {
            return EvolutionTokens.ContainsKey(id);
        }
    }
    public static Experiment NewExperiment(Guid id, ExperimentParameters parameters)
    {
        lock (_lock)
        {
            return ExperimentStore.Experiments[id] = new Experiment(parameters);
        }
    }
}

