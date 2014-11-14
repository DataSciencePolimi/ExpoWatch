var draw = function(data, element) {

  $(element).highcharts({
    chart: {
      zoomType: 'x'
    },
    title: {
      text: 'Twitter followers'
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
        text: '#followers'
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
      name: 'Twitter follower',
      pointInterval: 24 * 3600 * 1000,
      pointStart: data['twitter'][0][0],
      data: data['twitter']

    }]
  });
};

window.onload = function() {


  $.material.init();

  $.ajax('http://localhost:3210/stats?social=twitter')
    .done(function(result) {

      draw(result, '#twitter_abs');

    })
    .fail(function(jqXHR, textStatus) {
      console.log(textStatus);
    });

  $('li a[href="#twitter_delta"]').click(function(e) {
    console.log('asd');
    if ($('#twitter_delta .highcharts-container').length === 0) {
      console.log('lol');
      $.ajax('http://localhost:3210/delta?social=twitter')
        .done(function(result) {

          draw(result, '#twitter_delta');

        })
        .fail(function(jqXHR, textStatus) {
          console.log(textStatus);
        });
    }
  });



};