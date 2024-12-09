using lib;
using System.Linq;
using System.Text.Json;

internal class JSONConverter
{
    public static string MatrixToJson(double[,] matrix)
    {
        int rows = matrix.GetLength(0), cols = matrix.GetLength(1);
        double[][] array = new double[rows][];
        for (int i = 0; i < rows; i++)
        {
            array[i] = new double[cols];
            for (int j = 0; j < cols; j++)
            {
                array[i][j] = matrix[i, j];
            }
        }
        return JsonSerializer.Serialize(array);
    }
}

