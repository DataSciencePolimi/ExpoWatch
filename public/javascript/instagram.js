var draw = function(data, element) {

  $(element).highcharts({
    chart: {
      zoomType: 'x'
    },
    title: {
      text: 'Instagram followers'
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
      name: 'Instagram followers',
      pointInterval: 24 * 3600 * 1000,
      pointStart: data['instagram'][0][0],
      data: data['instagram']

    }]
  });
};


var drawPhotoStat = function(data) {

  $('#photo').highcharts({
    chart: {
      zoomType: 'x'
    },
    title: {
      text: 'Photo likes'
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
      name: 'Instagram followers',
      pointInterval: 24 * 3600 * 1000,
      pointStart: data.photoStats[0][0],
      data: data.photoStats

    }]
  });
};

window.onload = function() {

  $.material.init();

  $.ajax('stats?social=instagram')
    .done(function(result) {

      draw(result, '#instagram_abs');
      //drawPhotoStat(result);

    })
    .fail(function(jqXHR, textStatus) {
      console.log(textStatus);
    });

  $('li a[href="#instagram_delta"]').click(function(e) {
    console.log('asd');
    if ($('#instagram_delta .highcharts-container').length === 0) {
      console.log('lol');
      $.ajax('delta?social=instagram')
        .done(function(result) {

          draw(result, '#instagram_delta');

        })
        .fail(function(jqXHR, textStatus) {
          console.log(textStatus);
        });
    }
  });


};