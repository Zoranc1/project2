window.onresize = function() { 
    location.reload(); 
}

queue()
   .defer(d3.csv, "./WPP2017.csv")
   .await(makeGraphs);

function makeGraphs(error, projectsJson) {

    var mapWidth = $(window).width();
    var mapHeight = mapWidth / 2.222;
    var mapScale = mapWidth / 6.667;
    var translateX = mapWidth / 2;
    var translateY = mapHeight / 2;

    //Create a Crossfilter instance
    var ndx = crossfilter(projectsJson);

    //Define Dimensions
    var timeDim = ndx.dimension(function (d) {
        return d["Time"]; 
    });

    var ccDim = ndx.dimension(function (d) {
        return d["Country"];
    });
    //Calculate metrics
    var lifeYears = timeDim.group().reduceSum(dc.pluck('Births'));

    var worldlifeYears = ccDim.group().reduceSum(function(d) {
        return +Number(d['Births']).toFixed(2)});
     let timeCompDim = ndx.dimension(dc.pluck("Time"));
     
     let birthDeathDim = ndx.dimension(dc.pluck("Time"));
    
    let totalDim = timeCompDim.group().reduceSum(dc.pluck("Births"))
    
    // let birthDim = ndx.dimension(dc.pluck("Births"))
    let birthGroup =birthDeathDim.group().reduceSum(dc.pluck("Births"));
    
    // let deathDim = ndx.dimension(dc.pluck("Deaths"));
    let deathGroup =birthDeathDim.group().reduceSum(dc.pluck("Deaths"));
  
    let femaleGroup = timeCompDim.group().reduce(
        function(c, d) {
            let births = Number(d.Births);
            let SRB = Number(d.SRB);
            if (isNaN(births)) {
                births = 0;
            }
            if (isNaN(SRB)) {
                SRB = 1;
            }
            c.female += +(births / (1 + SRB)).toFixed(2);
            c.femcount++;
            c.femAverage = c.female / c.femcount;
            return c;
        },
        function(c, d) {
            let births = Number(d.Births);
            let SRB = Number(d.SRB);
            if (isNaN(births)) {
                births = 0;
            }
            if (isNaN(SRB)) {
                SRB = 1;
            }
            c.female -= +(births / (1 + SRB)).toFixed(2);
            c.femcount--;
            c.femAverage = c.female / c.femcount;
            return c;
        },
        function() {
            return {female: 0, femcount: 0, femAverage: 0}
        });
    let maleGroup = timeCompDim.group().reduce(
        function(c, d) {
            let births = Number(d.Births);
            let SRB = Number(d.SRB);
            if (isNaN(births)) {
                births = 0;
            }
            if (isNaN(SRB)) {
                SRB = 1;
            }
            c.male += +(births - (births / (1 + SRB))).toFixed(2);
            c.malecount++;
            c.maleAverage = c.male / c.malecount;
            return c;
        },
        function(c, d) {
            let births = Number(d.Births);
            let SRB = Number(d.SRB);
            if (isNaN(births)) {
                births = 0;
            }
            if (isNaN(SRB)) {
                SRB = 1;
            }
            c.male -= +(births - (births / (1 + SRB))).toFixed(2);
            c.malecount--;
            c.maleAverage = c.male / c.malecount;
            return c;
        },
        function() {
            return {male: 0, malecount: 0, maleAverage: 0}
        });
        
        let totalGroup = timeCompDim.group().reduce(
        function(c, d) {
            let births = Number(d.Births);
            if (isNaN(births)) {
                births = 0;
            }
            c.total += +births.toFixed(2);
            c.totalcount++;
            c.totalAverage = c.total / c.totalcount;
            return c;
        },
        function(c, d) {
            let births = Number(d.Births);
            if (isNaN(births)) {
                births = 0;
            }
            c.total -= +births.toFixed(2);
            c.totalcount--;
            c.totalAverage = c.total / c.totalcount;
            return c;
        },
        function() {
            return {total: 0, totalcount: 0, totalAverage: 0}
        });





    //Define charts
    var compTimeChart = dc.compositeChart("#Country-chart");
    var compBirthDeathChart = dc.compositeChart("#BirthDeth-chart");

    var worldChart = dc.geoChoroplethChart("#World-chart");
    
    

    compTimeChart
        .width(500)
        .height(200)
        .margins({ top: 10, right: 20, bottom: 50, left: 50 })
        .dimension(timeCompDim)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .group(totalDim)
        .title("")
        .on("renderlet", function(chart) {
            chart.selectAll("g.sub._0 rect").attr("width", "25");
            chart.selectAll("g.sub._1 rect").attr("width", "12");
            chart.selectAll("g.sub._2 rect").attr("width", "12");
            chart.selectAll("g._2").attr("transform", "translate(" + 13 + ", 0)");
        })
        .yAxisLabel("Totel Av.")
        .elasticY(true)
        .legend(dc.legend().x(0).y(140).itemHeight(13).gap(5))
        .compose([
            dc.barChart(compTimeChart)
            .colors("lightgray")
            .gap(5)
            .group(totalGroup, "Total")
            .valueAccessor(function(c) {
                return c.value.totalAverage;
            }),
            dc.barChart(compTimeChart)
            .colors("green")
            .gap(5)
            .group(maleGroup, "Male")
            .valueAccessor(function(c) {
                return c.value.maleAverage;
            }),
            dc.barChart(compTimeChart)
            .colors("red")
            .gap(5)
            .group(femaleGroup, "Female")
            .valueAccessor(function(c) {
                return c.value.femAverage;
            })
        ])
        .render()
        .yAxis().ticks(4);
        
    compBirthDeathChart
        .width(500)
        .height(200)
        .margins({ top: 10, right: 20, bottom: 50, left: 50 })
        .dimension(birthDeathDim)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .group(birthGroup)
        .title("")
        .on("renderlet", function(chart) {
            chart.selectAll("g.sub._0 rect").attr("width", "12");
            chart.selectAll("g.sub._1 rect").attr("width", "12");

            chart.selectAll("g._1").attr("transform", "translate(" + 13 + ", 0)");
        })
        .yAxisLabel("Totel ")
        .elasticY(true)
        .legend(dc.legend().x(0).y(140).itemHeight(13).gap(5))
        .compose([
            dc.barChart(compBirthDeathChart)
            .colors("green")
            .gap(5)
            .group(birthGroup, "Births"),
            dc.barChart(compBirthDeathChart)
            .colors("red")
            .gap(5)
            .group(deathGroup, "Deaths")
        ])
        .render()
        .yAxis().ticks(4);



    // Load the json geodata first

    d3.json("./world.json", function(worldcountries) {
    worldChart
        .dimension(ccDim)
        .width(mapWidth)
        .height(mapHeight)
        .group(worldlifeYears)
        .colors(d3.scale.quantize().range(["#17202A", "#424949", "#4D5656", "#626567", "#7B7D7D", "#B3B6B7", "#D0D3D4"]))
        .colorDomain([40, 155500000])
        .colorCalculator(function (d) { return d ? worldChart.colors()(d) : '#ccc'; })
        .overlayGeoJson(worldcountries.features, "country", function(d) {
            return d.id;
        })
        .projection(d3.geo.equirectangular()
            .translate([translateX,translateY])
            .scale(mapScale)
            .rotate([-10,0])
            );

           dc.renderAll();
   });
}