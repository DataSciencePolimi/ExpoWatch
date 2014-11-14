var draw = function(data, element) {

  $(element).highcharts({
    chart: {
      zoomType: 'x'
    },
    title: {
      text: 'Facebook likes'
    },
    subtitle: {
      text: document.ontouchstart === undefined ?
        'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
    },
    xAxis: {
      type: 'datetime',
      //minRange: 14 * 24 * 3600000 // fourteen days
    },
    yAxis: {
      title: {
        text: '#likes'
      }
    },
    legend: {
      enabled: false
    },
    plotOptions: {
      area: {
        fillColor: {
          linearGradient: {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 1
          },
          stops: [
            [0, Highcharts.getOptions().colors[0]],
            [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
          ]
        },
        marker: {
          radius: 2
        },
        lineWidth: 1,
        states: {
          hover: {
            lineWidth: 1
          }
        },
        threshold: null
      }
    },

    series: [{
      type: 'area',
      name: 'facebook likes',
      pointInterval: 24 * 3600 * 1000,
      ointStart: data['facebook'][0][0],
      data: data['facebook']

    }]
  });
};

window.onload = function() {

  $.material.init();

  $.ajax('http://dijkstra.seco:3210/stats?social=facebook')
    .done(function(result) {

      draw(result, '#facebook_abs');

    })
    .fail(function(jqXHR, textStatus) {
      console.log(textStatus);
    });

  $('li a[href="#facebook_delta"]').click(function(e) {
    console.log('asd');
    if ($('#facebook_delta .highcharts-container').length === 0) {
      console.log('lol');
      $.ajax('http://dijkstra.seco:3210/delta?social=facebook')
        .done(function(result) {

          draw(result, '#facebook_delta');

        })
        .fail(function(jqXHR, textStatus) {
          console.log(textStatus);
        });
    }
  });

};