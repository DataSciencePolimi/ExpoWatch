function slugify(Text) {
  return Text
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '');
}

var draw = function(data, name, element) {

  $(element).highcharts({
    chart: {
      zoomType: 'x'
    },
    title: {
      text: 'Twitter ' + name + 'followers'
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
      pointStart: data[0][0],
      data: data

    }]
  });
};

window.onload = function() {


  $.material.init();

  $.ajax('stats?social=twitter')
    .done(function(result) {

      for (k in result) {
        var $graphContainer = $('<div id="' + slugify(k) + '">');
        $graphContainer.appendTo($('#twitter_abs'));
        draw(result[k], k, '#' + slugify(k));
      }

    })
    .fail(function(jqXHR, textStatus) {
      console.log(textStatus);
    });

  $('li a[href="#twitter_delta"]').click(function(e) {
    console.log('asd');
    if ($('#twitter_delta .highcharts-container').length === 0) {
      console.log('lol');
      $.ajax('delta?social=twitter')
        .done(function(result) {

          for (k in result) {
            var $graphContainer = $('<div id="' + slugify(k) + '_delta">');
            $graphContainer.appendTo($('#twitter_delta'));
            draw(result[k], k, '#' + slugify(k) + '_delta');
          }

        })
        .fail(function(jqXHR, textStatus) {
          console.log(textStatus);
        });
    }
  });



};