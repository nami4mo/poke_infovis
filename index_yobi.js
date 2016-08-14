var w = 600;
var h = 400;
var padding = 30;
var svg;
var svg2;

$(function(){
  $(".bar-area input").slider();
  $("#x-buttons input").button();
  $("#y-buttons input").button();
  $("#evolve-select-area input").button();
  $("#type-select-area input").button();
  $("#search-area button").button();
  // 参考:http://stackoverflow.com/questions/6802085/jquery-ui-styled-text-input-box
  $("#search-area input").button()
  .css({'text-align':'left','outline':'none','cursor':'text'});

  // csvの読み込み
  d3.csv("poke_info.csv", function(error, data){
    if(error){
      alert("error");
    }
    else{
      // BMIの計算
      for( var i = 0 ; i < data.length ; i++ ){
        var raw_bmi = data[i]["weight"] / (data[i]["height"] * data[i]["height"]);
        data[i]["bmi"] = Math.round(raw_bmi*100)/100;
      }
      svg = d3.select("#graph")
      .append("svg")
      .attr("width", w)
      .attr("height", h);
      var evolve = ["1/1","1/2","2/2","1/3","2/3","3/3"];
      var types = ["ノーマル","ほのお","みず","でんき","くさ","こおり",
                   "かくとう","どく","じめん","ひこう","エスパー","むし",
                   "いわ","ゴースト","ドラゴン","あく","はがね","フェアリー"];
      // グラフ描画
      // -1 は スライダーによる範囲選択を行っていない状態を表す
      // もし負の値のデータも扱うようになれば、これを改善する必要がある
      createGraph(data,"height","weight",-1,-1,evolve,types);
    }
  });
});


function createGraph(poke_data, x_value, y_value, selected_x_max, selected_y_max, selected_evolutions, selected_types){

  // ------------- 前のグラフの削除------------
  if(svg){
    svg.selectAll("*").remove();
  }

  // ------------- 表示するポケモンのリスト ------------
  // タイプと進化段階で判断
  var showed_pokes = [];
  for( var i = 0 ; i < poke_data.length ; i++ ){
    var pd = poke_data[i];
    var evolve_type = String(pd["evolve"]) + "/" + String(pd["all_evolve"]);
    if( selected_evolutions.indexOf(evolve_type) == -1) continue;
    if( selected_types.indexOf(pd["type1"]) == -1 && selected_types.indexOf(pd["type2"]) == -1) continue;
    showed_pokes.push(pd);
  }

  // ------------- 表の設定 ------------
  var x_value_name = $("label[for='"+$("input:radio[name='x-radiobtn']:checked").attr("id")+"']").text();
  var y_value_name = $("label[for='"+$("input:radio[name='y-radiobtn']:checked").attr("id")+"']").text();
  $("#col-x").text(x_value_name);
  $("#col-y").text(y_value_name);
  $(".selected-pokemon").remove();


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
    createGraph( poke_data, x_value, y_value, $(this).val(), $("#y-range").val(), selected_evolutions, selected_types );
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
    createGraph( poke_data, x_value, y_value, $("#x-range").val(), $(this).val(), selected_evolutions, selected_types );
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
    createGraph(poke_data, x_cheked, y_cheked, -1, -1, selected_evolutions, selected_types);
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
    createGraph(poke_data, x_value, y_value, selected_x_max, selected_y_max, checked_evolve, selected_types);
  });


  // ----------- タイプのボタン設定 --------------
  $("#type-select-area")
  .off("change")
  .on("change",function(){
    // offでなぜか解除されるので
    $("#type-buttons-area input").button();
    var checked_types = [];
    $("#type-select-area input:checked").each(function(){
      checked_types.push( $(this).attr('value') );
    });
    createGraph(poke_data, x_value, y_value, selected_x_max, selected_y_max, selected_evolutions, checked_types);
  });


  // -------------- スケールの設定 --------------
  var xScale = d3.scale.linear()
  .domain([0, selected_x_max])
  .range([padding, w - padding]);

  var yScale = d3.scale.linear()
  .domain([0, selected_y_max])
  .range([h - padding, padding]);


  // -------------- 点の描画 --------------
  var tooltip = d3.select("body").select("#tooltip");

  svg.selectAll("circle")
  .data(showed_pokes)
  .enter()
  .append("circle")
  .attr("cx", function(d) {
    return xScale(d[x_value]);
  })
  .attr("cy", function(d) {
    return yScale(d[y_value]);
  })
  .attr("fill", function(d){
    var type1 = d["type1"];
    return type_to_color(type1);
  })
  .on("mouseover",function(d){
    d3.select(this).attr("r",8);
    // 参考: http://bl.ocks.org/hunzy/8647349
    // http://ajimonster.com/tool/html5_development_JS6.html
    tooltip.style("visibility", "visible").text(d["name"]);
    tooltip.style("top", ((arguments.callee.caller.arguments[0]||event).pageY-20)+"px")
    .style("left",((arguments.callee.caller.arguments[0]||event).pageX+10)+"px");
    console.log(d);
  })
  .on("mouseout",function(){
    d3.select(this).attr("r",4);
    tooltip.style("visibility", "hidden");
  })
  .attr("id",function(d){return "circle-" + d["id"];})
  .attr("opacity",0.8)
  .attr("r", 4);


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
  // グラフ外でmouseupしてもいいように
  $(window).mouseup(function(){
    if( drag_flag == 1 ){
      drag_flag = 0;
      rect_x_range = [xScale.invert(rect_x), xScale.invert(rect_x + rect_w)];
      rect_y_range = [yScale.invert(rect_y + rect_h), yScale.invert(rect_y)];
      console.log(rect_x_range, rect_y_range);
      show_selected_pokemons(rect_x_range, rect_y_range, x_value, y_value, showed_pokes);
    }
  });


  // ---------- ポケモン検索の設定 -------------
  $("#search-area button")
  .off("click")
  .on("click",function(){
    var input_text = $("#search-area input").val();
    var input_poke;
    for( var i = 0 ; i < showed_pokes.length ; i++ ){
      var tmp_poke = showed_pokes[i];
      if( input_text == tmp_poke["name"] ){
        input_poke = tmp_poke;
      }
    }
    console.log(input_poke)
    if( !input_poke ) return;
    var input_poke_x = input_poke[x_value];
    var input_poke_y = input_poke[y_value];
    var x_point = xScale(input_poke_x);
    var y_point = yScale(input_poke_y);
    console.log(x_point,y_point);
    particle(x_point,y_point);
    for( var i = 1 ; i < 4 ; i++ ){
      setTimeout("particle("+ x_point + "," + y_point + ")", 1000*i);
    }
  });

}

/*
===================================================================
*/

// ------------ 選択されたポケモンの表示 -------------
function show_selected_pokemons(x_range, y_range, x_value, y_value, pokes){
  selected_pokemons = [];
  for( var i = 0 ; i < pokes.length ; i++ ){
    var poke_x = pokes[i][x_value];
    var poke_y = pokes[i][y_value];
    if( x_range[0] < poke_x && poke_x < x_range[1] && y_range[0] < poke_y && poke_y < y_range[1] ){
      var poke_id = pokes[i]["id"];
      var poke_name = pokes[i]["name"];
      var poke_x = pokes[i][x_value];
      var poke_y = pokes[i][y_value];
      selected_pokemons.push( {"id": poke_id, "name": poke_name, "x": poke_x, "y": poke_y} );
    }
  }
  add_rows(selected_pokemons);

  $("#col-x").on("click",function(){
    selected_pokemons.sort(function(a,b){
      if(a.x > b.x) return -1;
      if(a.x < b.x) return 1;
      return 0;
    });
    add_rows(selected_pokemons)
  });
  $("#col-y").on("click",function(){
    selected_pokemons.sort(function(a,b){
      if(a.y > b.y) return -1;
      if(a.y < b.y) return 1;
      return 0;
    });
    add_rows(selected_pokemons)
  });
}

function add_rows(added_pokemons){
  $(".selected-pokemon").remove();
  for( var i = 0 ; i < added_pokemons.length ; i++ ){
    var poke = added_pokemons[i];
    $("<tr></tr>")
    .attr("id","selected-" + poke["id"])
    .addClass("selected-pokemon")
    .append("<td width='50%'>" + poke["name"] + "</td>")
    .append("<td width='25%'>" + poke["x"] + "</td>")
    .append("<td width='25%'>" + poke["y"] + "</td>")
    .appendTo("#pokemons-table");
  }
}

// ------------ タイプを色(rgb)に変換 ---------------
function type_to_color(type_name){
  if( type_name == "くさ" ) return "rgb(160,192,123)";
  else if( type_name == "ほのお" ) return "rgb(207,103,83)";
  else if( type_name == "みず" ) return "rgb(126,185,231)";
  else if( type_name == "でんき" ) return "rgb(240,210,128)";
  else if( type_name == "ノーマル" ) return "rgb(185,182,150)";
  else if( type_name == "どく" ) return "rgb(146,106,166)";
  else if( type_name == "エスパー" ) return "rgb(214,123,157)";
  else if( type_name == "むし" ) return "rgb(190,180,100)";
  else if( type_name == "かくとう" ) return "rgb(127,62,53)";
  else if( type_name == "いわ" ) return "rgb(192,165,100)";
  else if( type_name == "フェアリー" ) return "rgb(237,156,188)";
  else if( type_name == "はがね" ) return "rgb(201,212,223)";
  else if( type_name == "あく" ) return "rgb(106,90,79)";
  else if( type_name == "こおり" ) return "rgb(192,228,230)";
  else if( type_name == "ドラゴン" ) return "rgb(102,142,224)";
  else if( type_name == "ひこう" ) return "rgb(178,192,232)";
  else if( type_name == "じめん" ) return "rgb(230,209,153)";
  else if( type_name == "ゴースト" ) return "rgb(119,119,171)";
}

// ------------ particleのエフェクト ---------------
// 参考:http://bl.ocks.org/mbostock/1062544
function particle(cx,cy) {
  svg.append("circle")
  .attr("cx", cx)
  .attr("cy", cy)
  .attr("r", 1e-6)
  .attr("fill","none")
  .style("stroke","#ff00ff")
  .style("stroke-opacity", 1)
  .attr("stroke-width",2)
  .transition()
  .duration(1000)
  .ease(Math.sqrt)
  .attr("r", 30)
  .style("stroke-opacity", 1e-6)
  .remove();
  // d3.event.preventDefault();
}
