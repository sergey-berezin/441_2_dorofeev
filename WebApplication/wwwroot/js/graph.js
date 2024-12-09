let link, simulation;
const svg = d3.select("#graph");
const width = parseInt(svg.style("width"));
const height = parseInt(svg.style("height"));

// Генерация данных для графа
function generateGraph(matrix) {
    const nodes = [];
    const links = [];

    // Создаем узлы
    for (let i = 0; i < matrix.length; i++) {
        nodes.push({ id: i });
    }

    // Создаем связи
    for (let i = 0; i < matrix.length; i++) {
        for (let j = i + 1; j < matrix[i].length; j++) {
            if (matrix[i][j] > 0) {
                links.push({ source: i, target: j, weight: matrix[i][j] });
            }
        }
    }

    return { nodes, links };
}

function createGraph(graphData) {
    // Нормализуем веса рёбер для определения расстояний
    const maxWeight = d3.max(graphData.links, d => d.weight);
    const minWeight = d3.min(graphData.links, d => d.weight);
    const normalize = weight => {
        const minDistance = 50; // Минимальное расстояние между узлами
        const maxDistance = 300; // Максимальное расстояние между узлами
        return minDistance + (maxDistance - minDistance) * ((weight - minWeight) / (maxWeight - minWeight));
    };

    // Добавляем симуляцию
    simulation = d3.forceSimulation(graphData.nodes)
        .force("link", d3.forceLink(graphData.links)
            .distance(d => normalize(d.weight)) // Используем нормализованное расстояние
            .id(d => d.id))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2));

    // Создаем связи (линии)
    link = svg.selectAll(".link")
        .data(graphData.links)
        .enter().append("line")
        .attr("class", "link")
        .style("stroke", "gray")
        .style("stroke-width", 0.2);

    // Создаем узлы (кружки)
    const node = svg.selectAll(".node")
        .data(graphData.nodes)
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", 10)
        .style("fill", "steelblue")
        .call(d3.drag()
            .on("start", dragStarted)
            .on("drag", dragged)
            .on("end", dragEnded));

    // Добавляем метки узлов
    const labels = svg.selectAll(".label")
        .data(graphData.nodes)
        .enter().append("text")
        .attr("class", "label")
        .text(d => ` ${d.id}`)
        .style("font-size", "12px")
        .style("fill", "black");

    // Добавляем симуляцию движения
       simulation.on("tick", () => {
        link.attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node.attr("cx", d => d.x)
            .attr("cy", d => d.y);

        labels.attr("x", d => d.x + 12)
            .attr("y", d => d.y + 4);
    });
    function dragStarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragEnded(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

function clearGraph() {
    try {
        svg.selectAll("*").remove();
        simulation.stop();
    }
    catch { }
}


// Подсветка пути
function highlightPath(graphData, path) {
    // Преобразуем строку в массив чисел
    const nodesInPath = path.split("->").map(Number);

    // Определяем рёбра, которые входят в путь
    const edgesInPath = new Set();
    for (let i = 0; i < nodesInPath.length - 1; i++) {
        const source = nodesInPath[i];
        const target = nodesInPath[i + 1];

        // Найдем ребро, соответствующее текущей паре узлов
        graphData.links.forEach(link => {
            if ((link.source.id === source && link.target.id === target) ||
                (link.source.id === target && link.target.id === source)) {
                edgesInPath.add(link);
            }
        });
    }

    // Сбрасываем все рёбра к серому цвету
    link.style("stroke", "gray");
    link.style("stroke-width", "0.2");

    // Подсвечиваем рёбра в пути зелёным
    link.filter(d => edgesInPath.has(d))
        .style("stroke", "green")
        .style("stroke-width", 2);
}
