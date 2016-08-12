var w = 700;
var h = 500;
var padding = 30;
var svg;

$(function(){
  $("#x-buttons input").button();
  $("#y-buttons input").button();
  $("#evolve-select-area input").button();

  // csvの読み込み
  d3.csv("poke_info.csv", function(error, data){
    if(error){
      alert("error");
    }
    else{
      for( var i = 0 ; i < data.length ; i++ ){
        data[i]["bmi"] = data[i]["weight"] / (data[i]["height"] * data[i]["height"]);
      }
      svg = d3.select("#graph")
      .append("svg")
      .attr("width", w)
      .attr("height", h);
      // グラフ描画
      var evolve = ["1/1","1/2","2/2","1/3","2/3","3/3"];
      createGraph(data,"height","weight",-1,-1,evolve);
    }
  });
});



function createGraph(poke_data, x_value, y_value, selected_x_max, selected_y_max, selected_evolve){

  if(svg){
    svg.selectAll("*").remove();
  }

  // -------------- 最大値の取得 --------------
  // なぜかNumberと明記しないとバグる
  var x_max = d3.max(poke_data, function(d) { return Number(d[x_value]); });
  var y_max = d3.max(poke_data, function(d) { return Number(d[y_value]); })

  // バーで範囲の調整をしていないとき
  if(selected_x_max == -1){
    selected_x_max = x_max;
  }
  if(selected_y_max == -1){
    selected_y_max = y_max;
  }


  // -------------- 表の設定 ---------------
  $("#table-x-col").text( $("label[for='"+$("input:radio[name='x-radiobtn']:checked").attr("id")+"']").text() );
  $("#table-y-col").text( $("label[for='"+$("input:radio[name='y-radiobtn']:checked").attr("id")+"']").text() );

  // -------------- バーの設定 --------------
  $('#x-range')
  .off()
  .attr('max',x_max)
  .attr('step',function(){
    if(x_value == "height") return 0.1;
    else return 1;
  })
  .val(selected_x_max)
  .on("input",function(){
    $('#x-bar-value').text($(this).val());
  })
  .on("change",function(){
    createGraph( poke_data, x_value, y_value, $(this).val(), $("#y-range").val(), selected_evolve );
  });
  $('#x-bar-value').text( $('#x-range').val() );

  $('#y-range')
  .off()
  .attr('max',y_max)
  .attr('step',function(){
    if(y_value == "height") return 0.1;
    else return 1;
  })
  .val(selected_y_max)
  .on("input",function(){
    $('#y-bar-value').text($(this).val());
  })
  .on("change",function(){
    createGraph( poke_data, x_value, y_value, $("#x-range").val(), $(this).val(), selected_evolve );
  });
  $('#y-bar-value').text( $('#y-range').val() );


  // ----------- XYのボタン設定 --------------
  $("#select-buttons-area input")
  .off("change")
  .on("change",function(){
    // offでなぜか解除されるので
    $("#x-buttons input").button();
    $("#y-buttons input").button();
    var x_cheked = $("#x-buttons input:checked").val();
    var y_cheked = $("#y-buttons input:checked").val();
    createGraph(poke_data, x_cheked, y_cheked, -1, -1, selected_evolve);
  });


  // ----------- 進化のボタン設定 --------------
  $("#evolve-select-area")
  .off("change")
  .on("change",function(){
    // offでなぜか解除されるので
    $("#select-buttons-area input").button();
    var checked_evolve = [];
    $("#evolve-select-area input:checked").each(function(){
      checked_evolve.push( $(this).attr('value') );
    });
    createGraph(poke_data, x_value, y_value, selected_x_max, selected_y_max, checked_evolve);
  });



  // -------------- スケールの設定 --------------
  var xScale = d3.scale.linear()
  .domain([0, selected_x_max])
  .range([padding, w - padding]);

  var yScale = d3.scale.linear()
  .domain([0, selected_y_max])
  .range([h - padding, padding]);


  // -------------- 点の描画 --------------
  svg.selectAll("circle")
  .data(poke_data)
  .enter()
  .append("circle")
  .attr("cx", function(d) {
    return xScale(d[x_value]);
  })
  .attr("cy", function(d) {
    return yScale(d[y_value]);
  })
  .attr("fill", function(d){
    var evolve_type = String(d["evolve"]) + "/" + String(d["all_evolve"]);
    if( selected_evolve.indexOf(evolve_type) == -1) return "none";

    if( d["evolve"] == 1 && d["all_evolve"] == 1) return "rgb(255,0,0)";
    else if( d["evolve"] == 1 && d["all_evolve"] == 2) return "rgb(0,255,255)";
    else if( d["evolve"] == 2 && d["all_evolve"] == 2) return "rgb(0,255,127)";
    else if( d["evolve"] == 1 && d["all_evolve"] == 1) return "rgb(255,255,0)";
    else if( d["evolve"] == 2 && d["all_evolve"] == 2) return "rgb(193,255,0)";
    else if( d["evolve"] == 3 && d["all_evolve"] == 3) return "rgb(127,255,0)";
  })
  .attr("opacity",0.5)
  .attr("r", 2.5);


  // -------------- 軸の描画 --------------
  var xAxis = d3.svg.axis()
  .scale(xScale)
  .orient("bottom")
  .ticks(8);

  var yAxis = d3.svg.axis()
  .scale(yScale)
  .orient("left")
  .ticks(8);

  svg.append("g")
  .attr("class", "axis")
  .attr("transform", "translate(0," + (h - padding) + ")")
  .call(xAxis);

  svg.append("g")
  .attr("class", "axis")
  .attr("transform", "translate(" + padding + ",0)")
  .call(yAxis);


  // -------------- 領域選択の設定 --------------
  var drag_flag = 0
  var start_point = [0,0];
  var end_point = [0,0];
  var rect_x, rect_y, rect_w, rect_h;
  svg.on("mousedown", function(){
    start_point[0] = d3.mouse(this)[0];
    start_point[1] = d3.mouse(this)[1];
    drag_flag = 1;
  })
  .on("mousemove", function(){
    if(drag_flag == 0) return;
    svg.selectAll(".selection").remove();
    end_point = [0,0];
    end_point[0] = d3.mouse(this)[0];
    end_point[1] = d3.mouse(this)[1];
    // console.log(start_point[1],end_point[1]);
    rect_x = Math.min(start_point[0],end_point[0]);
    rect_y = Math.min(start_point[1],end_point[1]);
    rect_w = Math.abs(start_point[0] - end_point[0]);
    rect_h = Math.abs(start_point[1] - end_point[1]);
    svg.append("rect")
    .attr({
      x: rect_x,
      y: rect_y,
      width: rect_w,
      height: rect_h,
      class: "selection",
      stroke: "rgb(50,50,50)",
      "stroke-dasharray": [5,10],
      fill: "none"
    });
  });
  // mouseoutは変なところで動作してしまうので使えない
  // .on("mouseout", function(){
  //   drag_flag = 0;
  //   console.log("out");
  // })
  // .on("mouseup", function(){
  //   console.log("up");
  //   drag_flag = 0;
  // })

  $(window).mouseup(function(){
    if( drag_flag == 1 ){
      $(".poke-row").remove();
      drag_flag = 0;
      rect_x_range = [xScale.invert(rect_x), xScale.invert(rect_x + rect_w)];
      rect_y_range = [yScale.invert(rect_y + rect_h), yScale.invert(rect_y)];
      console.log(rect_x_range, rect_y_range);
      selected_pokemons = [];
      for( var i = 0 ; i < poke_data.length ; i++ ){
        var evolve_type = String(poke_data[i]["evolve"]) + "/" + String(poke_data[i]["all_evolve"]);
        if( selected_evolve.indexOf(evolve_type) == -1) continue;
        var poke_x = poke_data[i][x_value];
        var poke_y = poke_data[i][y_value];
        if( rect_x_range[0] < poke_x && poke_x < rect_x_range[1] && rect_y_range[0] < poke_y && poke_y < rect_y_range[1] ){
          var poke_id = poke_data[i]["id"];
          var poke_name = poke_data[i]["name"];
          selected_pokemons.push( {"poke_id": poke_id, "poke_name": poke_name} );
          var tr = "<tr class='poke-row'><td>" + poke_id + "</td><td>" + poke_name + "</td><td>" + poke_x + "</td><td>" + poke_y + "</td></tr>";
          $("#poke-table").append(tr);
        }
      }
      console.log(selected_pokemons);
    }
  });



}
