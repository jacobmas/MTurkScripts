// ==UserScript==
// @name         ClaraCLEP
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include file://*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_addValueChangeListener
// @grant        GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';

    var automate=GM_getValue("automate",false);
    var email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%]+(\.[^<>()\[\]\\.,;:：\s@"\?]+)*)|("[^\?]+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

    var phone_re=/[\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6}/im;
    var fax_re=/Fax[:]?[\s]?([\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/im;


    var personal_email_domains=["aol.com","bigpond.com","frontiernet.net","gmail.com","icloud.com","mchsi.com","me.com","pacbell.net","rogers.com","rr.com","ymail.com"];
    var my_query = {};
    var email_list=[];
    var sch_name="School District Name", sch_domain="Domain of school district";
    var bad_urls=["collegeboard.org"];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var first_try=true;

    var test_list=["American Government","American Literature","Analyzing and Interpreting Literature","Biology","Calculus","Chemistry",
                   "College Algebra","College Mathematics","English Composition (no essay)","English Composition (with essay)",
                   "English Literature","Financial Accounting","French Level I","French Level II","Freshmen College Composition","German Level I",
                   "German Level II","History, US I","History, US II","Human Growth and Development","Humanities","Information Systems and Computer Applications",
                   "Introduction to Educational Psychology","Introduction to Business Law","Introductory Psychology","Introductory Sociology","Natural Sciences",
                   "Pre-Calculus","Principles of Macroeconomics","Principles of Management","Principles of Marketing",
                   "Principles of Microeconomics","Social Science and History","Spanish Level I","Spanish Level II",
                   "Western Civilization I","Western Civilization II"];
    var test_regexes=[/American Government/,/American Lit/,/Analyzing and Interpreting Literature|Literature\s*\(?Analysis/,/Biology/,/Calculus/,/Chemistry/,
                   /College Algebra/,/College Mathematics/,/English Composition (no essay)/,/English Composition (with essay)|College Composition$/,
                   /English Literature/,/Financial Accounting/,/French .*(I|1)/,/French .*(II|2)/,/Freshmen College Composition/,/German.*(I|1)/,
                   /German.*(II|2)/,/History.*(United States|U\.?S\.?).*(I|1)/,/History.*(United States|U\.?S\.?).*(II|2)/,/Human Growth and Development/,/Humanities/,/Information Systems and Computer Applications/,
                   /Educational Psychology/,/Business Law/,/Introductory Psychology|Psychology\s*[\(,]?\s*Intro/,/Sociology/,/Natural Sciences/,
                   /Pre.*Calculus/,/Macroeconomics/,/Management/,/Marketing/,
                   /Microeconomics/,/Social Science.*History/,/Spanish.*(I|1)/,/Spanish.*(II|2)/,
                   /Western Civilization.*(I|1(?:$|[^\d]+))/,/Western Civilization.*(II|2)/];

    function check_function() { return true;  }
    function check_and_submit(check_function)
    {
        console.log("in check");
        if(!check_function())
        {
            GM_setValue("returnHit",true);
            console.log("bad");
            return;
        }
        console.log("Checking and submitting");
	if(GM_getValue("automate"))
        {
            setTimeout(function() { document.getElementById("submitButton").click(); }, 0);
        }
    }
    
    function is_bad_name(b_name)
    {
	return false;
    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow, b_caption,p_caption;
        var b1_success=false, b_header_search;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
	    

            console.log("b_algo.length="+b_algo.length);
     
            for(i=0; i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
		b_caption=b_algo[i].getElementsByClassName("b_caption");
		p_caption="";
		if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
		    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
		}
		console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);



                if(!is_bad_url(b_url, bad_urls,-1) && !is_bad_name(b_name)
                  && !/\/testing\//.test(b_url)
                  )
                {
                    b1_success=true;
		    break;

                }
                
            }
	    if(b1_success)
	    {
		/* Do shit */
		resolve(b_url);
		return;
	    }
           

        }
        catch(error)
        {
	    console.log("Error "+error);
	    reject(error);
            return;
            
            //reject(JSON.stringify({error: true, errorText: error}));
        }
	reject("Nothing found");
//        GM_setValue("returnHit",true);
        return;

    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
	    encodeURIComponent(search_str)+"&first=1&rdr=1";
	GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
            onload: function(response) { callback(response, resolve, reject); },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
            });
    }

    /* Following the finding the district stuff */
    function query_promise_then(b_url) {
        GM_xmlhttpRequest({method: 'GET', url: b_url,
            onload: function(response) { begin_parse(response); },
            onerror: function(response) { console.log("Fail"); },
            ontimeout: function(response) { console.log("Fail"); }
            });
    }

    function begin_parse(response) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in begin_parse");
        var table=doc.getElementsByTagName("table");
        var url=response.finalUrl
        var i;
        var matched_table_count=0;
        for(i=0; i < table.length; i++)
        {
            console.log("i="+i);
            var table_heading_map=get_table_heading(table[i]);
            console.log("table_heading_map="+JSON.stringify(table_heading_map));
            if(table_heading_map)
            {
                matched_table_count++;
                if(matched_table_count===1 || /CLEP/.test(table[i].rows[0].innerText))
                {
                    parse_table(table[i],table_heading_map,url); }
                
            }
        }

    }

    function parse_table(table,table_map,url)
    {
        var i,j,k;
       // console.log("table="+JSON.stringify(table.innerText));
        console.log("table_map="+JSON.stringify(table_map));
        document.getElementById("url").value=url;
        var curr_row;
        var max_pos=3;
        var row_str;
        var text;
        for(var x in table_map) { if(parseInt(table_map[x])>max_pos) { max_pos=parseInt(table_map[x]); } }
        console.log("max_pos="+max_pos);
        var score_match;
        var inputs=document.querySelectorAll("input[class='col-xs-8']");

        console.log("inputs.length="+inputs.length+", test_list.length="+test_list.length);
        for(i=1; i < table.rows.length; i++)
        {
            curr_row=table.rows[i];
            console.log("curr_row.length="+curr_row.cells.length);
            if(curr_row.cells.length < max_pos) continue;
            row_str="";
            for(k=0; k < curr_row.cells.length; k++)
            {
                row_str=row_str+curr_row.cells[k].innerText+";"; }
            console.log("curr_row("+i+")="+row_str.replace(/,$/,""));
          //  console.log("curr_row.cells["+table_map.test+"]="+curr_row.cells[table_map.test].innerText);
            for(j=0; j < test_list.length; j++)
            {
                text=curr_row.cells[table_map.test].innerText.replace(/&/g,"and");
                if(test_list[j].indexOf(text)!==-1 || test_regexes[j].test(text))
                {
                //    console.log("curr_row.cells[table_map.test].innerText="+curr_row.cells[table_map.test].innerText);
                    score_match=curr_row.cells[table_map.score].innerText.match(/[\d]+/);
                    if(score_match) inputs[2*j].value=score_match[0]; //curr_row.cells[table_map.score].innerText;
                    let credit_match=curr_row.cells[table_map.credit].innerText.match(/[\d]+/);
                    if(credit_match) inputs[2*j+1].value=credit_match[0];
                }


            }
        }
    }

    function get_table_heading(table)
    {
        var i;
        var result={};
        if(table.rows.length===0) return null;
        var row=table.rows[0],text;
        result.length=row.cells.length;
        console.log("row.innerText="+row.innerText);
        for(i=0; i < row.cells.length; i++)
        {
            text=row.cells[i].innerText;

            if(/CLEP|Test$|Exam|Subject/i.test(text)) result.test=i;
            if(/Score|Scoring/i.test(text)) result.score=i;
            else if(/Credit|Hours|Hrs/i.test(text)) result.credit=i;
        }


        if(result.test===undefined || result.score===undefined || result.credit===undefined)
        {
            console.log("Failed: result="+JSON.stringify(result));
            return null;
        }
        return result;
    }

    function paste_table(e)
    {
        e.preventDefault();
         var text = e.clipboardData.getData("text/plain");
        var begin_pos=0;
        var text_split=text.split("\n");
        var table_map={test:0,credit:2,score:1};
        var curr_line,i,j,split_line,line_match;
        var line_regex=/^(.*?)\s([\d]{2})\+?\s(\d{1,2}(?:.00)?)/;
        var line_regex2=/^(.*?)\s([\d]{2})\s.*?(\d{1,2})$/;
        var table=document.createElement("table");
        var row=table.insertRow();
        if(text_split.length>0 && /Credit|Score|Test/.test(text_split[0]) && text_split[0].split(/[\t	]+/).length>=3)
        {
            begin_pos++;
            split_line=text_split[0].split(/[\t	]+/);
            let table2=document.createElement("table");
            row=table2.insertRow();
            for(i=0; i < split_line.length; i++)
            {
                row.insertCell().innerHTML=split_line[i];
            }
            table_map=get_table_heading(table2);
            console.log("table_map="+JSON.stringify(table_map));
            if(!table_map) table_map={test:0,credit:2,score:1};
            console.log("Found table_map="+JSON.stringify(table_map));

        }
        else
        {
            console.log("/Credit|Score|Test/.test("+text_split[0]+")="+/Credit|Score|Test/.test(text_split[0]));
            //console.log("split_line.length="+split_line.length);
            row.insertCell().innerHTML="Test";
            row.insertCell().innerHTML="Score";
            row.insertCell().innerHTML="Credit";
        }
        for(i=begin_pos; i < text_split.length; i++)
        {

            row=table.insertRow();
            curr_line=text_split[i];//.replace(/\d{3,}/g,"");
            split_line=curr_line.split(/[\t]+/);
            if(split_line.length<3)
            {
                line_match=curr_line.match(line_regex);
                if(line_match!==null)
                {
                  console.log("("+i+"): line_match="+line_match);
                    for(j=1; j<=3; j++)
                    {
                        row.insertCell().innerHTML=line_match[j];
                    }
                }
                else
                {
                    line_match=curr_line.match(line_regex2);
                    if(line_match!==null)
                    {
                        console.log("("+i+"): line_match="+line_match);
                        for(j=1; j<=3; j++)
                        {
                            row.insertCell().innerHTML=line_match[j];
                        }
                    }
                    else
                    {
                        console.log("("+i+"): fail="+curr_line);
                        table.deleteRow(-1);
                    }
                }
            }
            else
            {
               console.log("("+i+"): split_line="+split_line);
                for(j=0; j < split_line.length; j++)
                {
                    row.insertCell().innerHTML=split_line[j];
                }
            }

        }
        parse_table(table,table_map,"");

    }



    function init_Query()
    {
        var panel=document.getElementsByClassName("panel-body")[0].innerText;
        var panelBody=document.getElementsByClassName("panel-body")[0];
        var x;
        var foundNonText=false;
        var curr_child=panelBody.childNodes[0];
        while(true && panelBody.childNodes.length>0)
        {
            curr_child=panelBody.childNodes[0];
            //console.log("curr_child="+curr_child);
            if(curr_child.nodeType===Node.TEXT_NODE)
            {
             //   console.log("TEXT: curr_child.textContent="+curr_child.textContent);
             //   break;
            }
           //else if(!curr_child.nodeType===Node.TEXT_NODE) { console.log("NEITHER: "); foundNonText=true; }
            if(curr_child.nodeType===Node.COMMENT_NODE) {
              // console.log("COMMENT: curr_child.textContent="+curr_child.textContent);
                break;
            }
            panelBody.removeChild(curr_child);
        }

        var inst_regex=/Institution Name:\s*([^\n]+)/;
        var city_regex=/City:\s*([^\n]+)/;
        var state_regex=/State:\s*([^\n]+)/;
        document.getElementById("clep_american_gov_score").addEventListener("paste",paste_table);
       // var strong=panel[0].getElementsByTagName("strong");
       // var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        my_query={name:panel.match(inst_regex)[1],city:panel.match(city_regex)[1],state:panel.match(state_regex)[1]};
        console.log("my_query="+JSON.stringify(my_query));
	var search_str=my_query.name+" CLEP credit policy";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });





    }

    /* Failsafe to stop it  */
    window.addEventListener("keydown",function(e) {
        if(e.key !== "F1") {
            return;
        }
        GM_setValue("stop",true);
     });


    if (window.location.href.indexOf("mturkcontent.com") !== -1 || window.location.href.indexOf("amazonaws.com") !== -1)
    {
        var submitButton=document.getElementById("submitButton");
        if(!submitButton.disabled )
        {

            init_Query();
        }

    }
    else if(window.location.href.indexOf("instagram.com")!==-1)
    {
        GM_setValue("instagram_url","");
        GM_addValueChangeListener("instagram_url",function() {
            var url=GM_getValue("instagram_url");
            window.location.href=url;
        });
        do_instagram();
    }
    else if(window.location.href.indexOf("worker.mturk.com")!==-1)
    {

	/* Should be MTurk itself */
        var globalCSS = GM_getResourceText("globalCSS");
        GM_addStyle(".btn-ternary { border: 1px solid #FA7070; background-color: #FA7070; color: #111111; }");
       var pipeline=document.getElementsByClassName("work-pipeline-action")[0];
        if(GM_getValue("automate")===undefined) GM_setValue("automate",false);

        var btn_span=document.createElement("span");
        var btn_automate=document.createElement("button");

         var btns_primary=document.getElementsByClassName("btn-primary");
        var btns_secondary=document.getElementsByClassName("btn-secondary");
         var my_secondary_parent=pipeline.getElementsByClassName("btn-secondary")[0].parentNode;
        btn_automate.className="btn btn-ternary m-r-sm";
        btn_automate.innerHTML="Automate";
        btn_span.appendChild(btn_automate);
        pipeline.insertBefore(btn_span, my_secondary_parent);
         GM_addStyle(globalCSS);
        if(GM_getValue("automate"))
        {
            btn_automate.innerHTML="Stop";
            /* Return automatically if still automating */
            setTimeout(function() {

                if(GM_getValue("automate")) btns_secondary[0].click();
                }, 20000);
        }
        btn_automate.addEventListener("click", function(e) {
            var auto=GM_getValue("automate");
            if(!auto) btn_automate.innerHTML="Stop";
            else btn_automate.innerHTML="Automate";
            GM_setValue("automate",!auto);
        });
        GM_setValue("returnHit",false);
        GM_addValueChangeListener("returnHit", function() {
            if(GM_getValue("returnHit")!==undefined && GM_getValue("returnHit")===true &&
               btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Return"
              )
            {
                if(GM_getValue("automate")) {
                    setTimeout(function() { btns_secondary[0].click(); }, 0); }
            }
        });
        /* Regular window at mturk */

       
        if(GM_getValue("stop") !== undefined && GM_getValue("stop") === true)
        {
        }
        else if(btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Skip" &&
                btns_primary!==undefined && btns_primary.length>0 && btns_primary[0].innerText==="Accept")
        {

            /* Accept the HIT */
            if(GM_getValue("automate")) {
                btns_primary[0].click(); }
        }
        else
        {
            /* Wait to return the hit */
            var cboxdiv=document.getElementsByClassName("checkbox");
            var cbox=cboxdiv[0].firstChild.firstChild;
            if(cbox.checked===false) cbox.click();
        }

    }


})();
