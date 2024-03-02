int calcPointIters(double x0, double y0, int maxIters)
{
    double x, y, xTemp = 0.0;
    int iteration = 0;
    while (x * x + y * y <= 4.0 && iteration < maxIters)
    {
        xTemp = x * x - y * y + x0;
        y = 2 * x * y + y0;
        x = xTemp;
        iteration++;
    }
    return iteration % maxIters;
}

double remap(double n, double oldMin, double oldMax, double newMin, double newMax)
{
    return (n / (oldMax - oldMin)) * (newMax - newMin) + newMin;
}