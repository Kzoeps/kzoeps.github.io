function loadData() {
    Promise.all([
        d3.json("gadm41_BTN_1.json"),
        d3.json("data/dzongkhag-population.json")
    ])
        .then(([geoJsonData, populationData]) => {
            const map = L.map('map').setView([27.5142, 90.4336], 8);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

            // Function to get color based on population
            function getColor(d) {
                return d > 100000 ? '#800026' :
                    d > 60000 ? '#BD0026' :
                        d > 35000 ? '#E31A1C' :
                            d > 15000 ? '#FC4E2A' :
                                d > 5000 ? '#FD8D3C' :
                                    d > 2000 ? '#FEB24C' :
                                        '#FFEDA0';
            }

            // Style function for GeoJSON layer
            function style(feature) {
                return {
                    fillColor: getColor(populationData[feature.properties.NAME_1]?.["Both Sex"]),
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    dashArray: '3',
                    fillOpacity: 0.7
                };
            }
            const legend = L.control({ position: 'bottomright' });

            legend.onAdd = function (map) {
                const div = L.DomUtil.create('div', 'info legend');
                const populations = [0, 1000, 2000, 5000, 10000, 20000, 50000, 100000];

                // Legend title
                div.innerHTML += '<h4>Population</h4>';

                // Loop through population intervals and generate a label with a colored square for each interval
                for (let i = 0; i < populations.length; i++) {
                    div.innerHTML +=
                        '<i style="background:' + getColor(populations[i] + 1) + '"></i> ' +
                        populations[i] + (populations[i + 1] ? '&ndash;' + populations[i + 1] + '<br>' : '+');
                }

                return div;
            };

            legend.addTo(map);

            // Add GeoJSON data to the map
            L.geoJSON(geoJsonData, {
                style: style,
                onEachFeature: function (feature, layer) {
                    layer.bindTooltip(`
                        <strong>${feature.properties.NAME_1}</strong><br>
                        Population: ${populationData[feature.properties.NAME_1]?.["Both Sex"]}
                    `, {
                        permanent: false,
                        direction: 'right',
                        className: 'dzongkhag-tooltip'
                    });
                }
            }).addTo(map);
        })
        .catch(err => {
            console.error("Error loading data:", err);
        });
}

loadData();
