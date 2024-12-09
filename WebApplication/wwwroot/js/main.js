let matrix = "",
    graphData;

// Убедитесь, что функции доступны глобально
window.createExperiment = async function createExperiment() {
    const form = document.getElementById('experiment-form');
    const formData = new FormData(form);
    const params = {
        nodesAmount: Number(formData.get('nodesAmount')),
        epochs: Number(formData.get('epochs')),
        populationSize: Number(formData.get('populationSize')),
        mutationProbability: Number(formData.get('mutationProbability')),
        crossoverProbability: Number(formData.get('crossoverProbability')),
        survivorsPart: Number(formData.get('survivorsPart')),
    };

    const response = await fetch('/experiments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });

    const result = await response.json();
    document.getElementById('results').value = `Experiment Created: ${result.experimentId}`;
    document.getElementById('experimentId').value = `${result.experimentId}`;
    renderMatrix(result.matrix);
    clearGraph();
    graphData = generateGraph(matrix);
    createGraph(graphData);
    highlightPath(graphData, result.best);
};

window.deleteExperiment = async function deleteExperiment() {
    const experimentId = document.getElementById('experimentId').value;

    if (!experimentId) {
        alert("Please enter a valid Experiment ID.");
        return;
    }

    const response = await fetch(`/experiments/${experimentId}`, {
        method: 'DELETE',
    });

    if (response.ok) {
        document.getElementById('results').value = `Experiment ${experimentId} deleted successfully.`;

    } else {
        const error = await response.text();
        document.getElementById('results').value = `Error: ${error}`;
    }
    document.getElementById('currentEpoch').value = "";
    clearGraph();
};

window.runNextStep = async function runNextStep() {
    const experimentId = document.getElementById('experimentId').value;

    if (!experimentId) {
        alert("Please enter a valid Experiment ID.");
        return;
    }

    const response = await fetch(`/experiments/${experimentId}`, {
        method: 'POST',
    });

    if (response.ok) {
        const result = await response.json();
        document.getElementById('results').value = `Next Step Result: ${result.fScore}`;
        document.getElementById('currentEpoch').value = `${result.epochs}`;
        highlightPath(graphData, result.best);

    } else {
        const error = await response.text();
        document.getElementById('results').value = `Error: ${error}`;
        clearGraph();
    }
};

window.startEvolution = async function startEvolution() {
    const experimentId = document.getElementById('experimentId').value;

    if (!experimentId) {
        alert("Please enter a valid Experiment ID.");
        return;
    }

    const response = await fetch(`/experiments/${experimentId}/start`, { method: 'POST' });

    if (response.ok) {
        document.getElementById('results').value = `Experiment ${experimentId} started successfully.`;

        // Подключаемся к серверу через SSE
        const eventSource = new EventSource(`/experiments/${experimentId}/stream`);
        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            document.getElementById('results').value = `Current Fitness: ${data.fScore}`;
            document.getElementById('currentEpoch').value = `${data.epochs}`;
            highlightPath(graphData, data.best);
        };

        eventSource.onerror = () => {
            eventSource.close();
            document.getElementById('results').value = `Experiment ${experimentId} stopped or error occurred.`;
        };
    } else {
        const error = await response.text();
        document.getElementById('results').value = `Error: ${error}`;
    }
};


window.stopEvolution = async function stopEvolution() {
    const experimentId = document.getElementById('experimentId').value;

    if (!experimentId) {
        alert("Please enter a valid Experiment ID.");
        return;
    }

    const response = await fetch(`/experiments/${experimentId}/stop`, {
        method: 'POST',
    });

    if (response.ok) {
        document.getElementById('results').value = `Experiment ${experimentId} stopped successfully.`;
    } else {
        const error = await response.text();
        document.getElementById('results').value = `Error: ${error}`;
    }
};



function renderMatrix(matrixString) {
    try {
        // Преобразуем строку в JSON
        matrix = JSON.parse(matrixString);

        // Проверим, что данные являются массивом массивов
        if (!Array.isArray(matrix) || !matrix.every(row => Array.isArray(row))) {
            console.error("Преобразованные данные должны быть матрицей (массивом массивов).");
            return;
        }

        // Найти контейнер для таблицы
        const container = document.getElementById("table-container");

        // Проверяем, что контейнер существует
        if (!container) {
            console.error("Не найден контейнер с id 'table-container'.");
            return;
        }

        // Создаем элемент таблицы
        const table = document.createElement("table");
        table.style.borderCollapse = "collapse";
        table.style.width = "100%";
        table.style.textAlign = "center";

        // Создаем заголовок таблицы
        const headerRow = document.createElement("tr");
        const emptyHeader = document.createElement("th");
        emptyHeader.textContent = ""; // Пустая ячейка в углу
        emptyHeader.style.backgroundColor = "#f0f0f0";
        emptyHeader.style.border = "1px solid black";
        headerRow.appendChild(emptyHeader);

        // Добавляем заголовки столбцов
        for (let i = 0; i < matrix.length; i++) {
            const th = document.createElement("th");
            th.textContent = i; // Номер узла
            th.style.backgroundColor = "#f0f0f0";
            th.style.border = "1px solid black";
            th.style.padding = "8px";
            headerRow.appendChild(th);
        }
        table.appendChild(headerRow);

        // Заполняем строки таблицы
        matrix.forEach((row, rowIndex) => {
            const tr = document.createElement("tr");

            // Заголовок строки
            const th = document.createElement("th");
            th.textContent = rowIndex; // Номер узла
            th.style.backgroundColor = "#f0f0f0";
            th.style.border = "1px solid black";
            th.style.padding = "8px";
            tr.appendChild(th);

            // Ячейки строки
            row.forEach(cell => {
                const td = document.createElement("td");
                td.textContent = cell; // Заполняем ячейку значением
                td.style.border = "1px solid black";
                td.style.padding = "8px";
                tr.appendChild(td);
            });

            table.appendChild(tr);
        });

        // Очищаем содержимое контейнера и вставляем новую таблицу
        container.innerHTML = "";
        container.appendChild(table);

    } catch (error) {
        console.error("Ошибка обработки строки матрицы:", error);
    }
}