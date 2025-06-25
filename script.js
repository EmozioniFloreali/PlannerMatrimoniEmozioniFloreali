
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('wedding-form');
    const list = document.getElementById('wedding-list');
    const searchInput = document.getElementById('search');
    const exportPDF = document.getElementById('exportPDF');
    const exportExcel = document.getElementById('exportExcel');
    const calendar = document.getElementById('calendar');

    let matrimoni = JSON.parse(localStorage.getItem('matrimoni')) || [];

    function salvaDati() {
        localStorage.setItem('matrimoni', JSON.stringify(matrimoni));
    }

    function calcolaSaldo(prezzo, acconto) {
        const p = parseFloat(prezzo.replace(',', '.')) || 0;
        const a = parseFloat(acconto.replace(',', '.')) || 0;
        return (p - a).toFixed(2);
    }

    function creaVoceMatrimonio(m, index) {
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${m.data} - ${m.sposi}</strong><br>
            Chiesa: ${m.chiesa}<br>
            Sala: ${m.sala}<br>
            Prezzo: €${m.prezzo} - Acconto: €${m.acconto} - <b>Saldo: €${calcolaSaldo(m.prezzo, m.acconto)}</b><br>
            <button onclick="modifica(${index})">✏️</button>
            <button onclick="elimina(${index})">🗑️</button>
            <button onclick="generaPDF(${index})">📄 PDF</button>
        `;
        list.appendChild(li);
    }

    function aggiornaLista(filtra = '') {
        list.innerHTML = '';
        matrimoni
            .filter(m => m.sposi.toLowerCase().includes(filtra.toLowerCase()) || m.data.includes(filtra))
            .forEach((m, i) => creaVoceMatrimonio(m, i));
    }

    form.addEventListener('submit', e => {
        e.preventDefault();
        const m = {};
        [...form.elements].forEach(el => {
            if (el.id) m[el.id] = el.value;
        });
        matrimoni.push(m);
        salvaDati();
        aggiornaLista();
        form.reset();
    });

    searchInput.addEventListener('input', () => aggiornaLista(searchInput.value));

    window.elimina = (i) => {
        if (confirm('Eliminare questo matrimonio?')) {
            matrimoni.splice(i, 1);
            salvaDati();
            aggiornaLista();
        }
    };

    window.modifica = (i) => {
        const m = matrimoni[i];
        for (const key in m) {
            if (form[key]) form[key].value = m[key];
        }
        matrimoni.splice(i, 1);
        salvaDati();
        aggiornaLista();
    };

    window.generaPDF = (i) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const m = matrimoni[i];
        const logo = new Image();
        logo.src = "data:image/png;base64," + `{img_base64}`;
        logo.onload = () => {
            doc.addImage(logo, 'PNG', 10, 10, 30, 30);
            doc.setFontSize(16);
            doc.text("Emozioni Floreali di Giusy Surace", 50, 20);
            doc.setFontSize(12);
            let y = 50;
            for (const key in m) {
                const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                const value = m[key];
                doc.text(`${label}: ${value}`, 10, y);
                y += 10;
                if (y > 280) {
                    doc.addPage();
                    y = 20;
                }
            }
            const saldo = calcolaSaldo(m.prezzo, m.acconto);
            doc.text(`Saldo residuo: €${saldo}`, 10, y);
            doc.save(`${m.data}_${m.sposi}.pdf`);
        };
    };

    exportPDF.addEventListener('click', () => {
        matrimoni.forEach((_, i) => setTimeout(() => window.generaPDF(i), i * 1000));
    });

    exportExcel.addEventListener('click', () => {
        const ws = XLSX.utils.json_to_sheet(matrimoni);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Matrimoni");
        XLSX.writeFile(wb, "agenda_matrimoni.xlsx");
    });

    aggiornaLista();
});
