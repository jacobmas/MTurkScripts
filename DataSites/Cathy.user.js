// ==UserScript==
// @name         Cathy
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Scrape Yahoo!Finance
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include file://*
// @include https://*adviserinfo.sec.gov*
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
// @connect finance.yahoo.com
// @connect yahoo.com
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
    var bad_urls=[];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var first_try=true;

    function check_function()
    {
        return true;
    }
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
            setTimeout(function() { document.getElementById("submitButton").click(); }, 500);
        }
    }
    function is_bad_name(b_name,i)
    {
        if(i===undefined) return true;
        var temp_name=my_query.name.replace(/\s+([A-Z]+)$/,"").replace(/[-\'\.]+/g,"").toLowerCase().replace(" north america","");
        b_name=b_name.replace(/[-\'\.]+/g,"").toLowerCase();
        console.log("temp_name="+temp_name);
        if(b_name.toLowerCase().indexOf(my_query.name.toLowerCase())!==-1) return false;
        else if(b_name.toLowerCase().indexOf(temp_name.toLowerCase())!==-1) return false;
        else if(temp_name.toLowerCase().indexOf(b_name.toLowerCase())!==-1) return false;
        else if(i===0 && temp_name.split(" ")[0]===b_name.split(" ")[0] &&temp_name.split(" ")[0]!=="bank" ) return false;
        return true;
    }


    function bloom_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in bloom_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        resolve({name:my_query.name,isPrivate:false});
        var b_url="crunchbase.com", b_name, b_factrow, b_caption,p_caption;
        var b1_success=false, b_header_search,b_split;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");

            console.log("b_algo.length="+b_algo.length);

            for(i=0; i < b_algo.length; i++)
            {
                p_caption="";
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");//[0].innerText;
                if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0)
                {
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
                }
                else if(b_algo[i].getElementsByClassName("tab-content").length>0)
                {
                    p_caption=b_algo[i].getElementsByClassName("tab-content")[0].innerText;
                }
               // console.log("("+i+"), b_url="+b_url+", b_name="+b_name+"\n\t"+p_caption);

                if(!is_bad_url(b_url, bad_urls,-1) && !is_bad_name(b_name,i))
                {
                    b1_success=true;
                    break;

                }

            }
            if(b1_success)
            {
                /* Do shit */
                resolve({name:b_name.split(" - ")[0],isPrivate:true});
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
        resolve({name:my_query.given_name,isPrivate:false});
        //        GM_setValue("returnHit",true);
        return;

    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0,j,inner_a,inner_p;
        var b_url="crunchbase.com", b_name, b_factrow, b_caption,p_caption;
        var b1_success=false, b_header_search, symbol_match;
        var symbol_regexes=[/quote\/([^\/]*)(\/|$)/,/\?s\=(.*)(\/|$)/];
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");

            console.log("b_algo.length="+b_algo.length);
     
            for(i=0; i < b_algo.length && i < 3; i++)
            {
                p_caption="";
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_name=b_name.replace(/^[^\|]+\|\s*/,"").replace(/Stock -.*$/,"").replace(/Ordinary Share -.*$/,"");
                b_name=shorten_company_name(b_name.replace(/^[^:]+: Summary for /,"").replace(/- Yahoo.*$/,""));

                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");//[0].innerText;
                if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0)
                {
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
                }
                else if(b_algo[i].getElementsByClassName("tab-content").length>0)
                {
                    p_caption=b_algo[i].getElementsByClassName("tab-content")[0].innerText;
                }
                console.log("("+i+"), b_url="+b_url+", b_name="+b_name+"\n\tcaption:"+p_caption);

                for(j=0; j < symbol_regexes.length; j++)
                {
                    symbol_match=b_url.match(symbol_regexes[j]);
                    if(symbol_match && !is_bad_name(b_name,i))
                    {
                        resolve(symbol_match[1]);
                        return;
                    }
                }
               
                
            }
	   
           

        }
        catch(error)
        {
	    console.log("Error "+error);
	    reject(error);
            return;
            
            //reject(JSON.stringify({error: true, errorText: error}));
        }
        if(my_query.query_tries<1)
        {
            my_query.query_tries++;
            my_query.name=shorten_company_name(my_query.given_name);
            console.log("Searching again");
            query_search(my_query.name+" quote site:finance.yahoo.com/quote",resolve,reject,query_response);
            return;
        }
        else if(my_query.query_tries<2)
        {
          my_query.query_tries++;
            my_query.name=shorten_company_name(my_query.given_name);
            console.log("Searching again");
            query_search(my_query.ticker+" site:finance.yahoo.com/quote",resolve,reject,query_response);
            return;
        }
        else
        {
            console.log("No symbols found, doing advisor");
            do_advisorlookup();
            


            //        GM_setValue("returnHit",true);
            return;
        }

    }

    function do_advisorlookup()
    {
       // GM_setValue("my_query",{name:""});
         for(let x in my_query.results)
            {
                if(document.getElementById(x))                document.getElementById(x).value="PRIVATE";
            }
        GM_setValue("sec_result","");
        GM_addValueChangeListener("sec_result",function()  {
            var result=arguments[2];
        });
        GM_setValue("my_query",my_query);
       /* GM_xmlhttpRequest({method: 'POST', url: "https://www.adviserinfo.sec.gov/IAPD/IAPDSearch.aspx",
                           data:encodeURIComponent("ctl00$cphMain$sbox$txtFirm")+"="+encodeURIComponent(my_query.name),
            onload: function(response) { bob_response(response); },
            onerror: function(response) { console.log("Fail"); },
            ontimeout: function(response) { console.log("Fail"); }
            });*/
        

            check_and_submit(check_function,automate);
    }

    function bob_response(response)
    {
         var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("doc.body.innerHTML="+doc.body.innerHTML);
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

    function bloom_promise_then(result) {
       // my_query.name=shorten_company_name(result.trim());
        console.log("New name="+my_query.name);
        var i;
        var inputs=document.getElementsByClassName("form-control");
        if(result.isPrivate)
        {
            console.log("Company is private");
            for(i=0; i < inputs.length; i++)
            {
                inputs[i].value="PRIVATE";
            }
            check_and_submit(check_function);
            return;
        }

        var search_str=my_query.name+" "+my_query.ticker+" quote site:finance.yahoo.com/quote";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });

    }

    /* Following the finding the district stuff */
    function query_promise_then(symbol) {

        var i;
        symbol=decodeURIComponent(symbol).replace(/\?.*$/,"");
        console.log("\n\nsymbol="+symbol);
        var query_list=[{name:"financials",parser:parse_financials, callback: add_and_check},{name:"key-statistics",parser:parse_key,callback:add_and_check}];
        var currPromise;
        var promise_list=[];
        for(i=0; i < query_list.length; i++)
        {
            promise_list.push(make_promise(query_list[i],symbol));
        }
    }

    function add_and_check(message)
    {
        var x;
        console.log(message);
        console.log("my_query.results="+JSON.stringify(my_query.results));
        for(x in my_query.results)
        {
            my_query.results[x]=my_query.results[x].replace(/(N\/A|NA)/,"0");
            if(document.getElementById(x))
            {
                document.getElementById(x).type="text";
                document.getElementById(x).value=my_query.results[x];
            }
        }
        if(is_done())
        {
            check_and_submit(check_function);
        }
    }

    function make_promise(query,symbol)
    {
        var begin_url="https://finance.yahoo.com/quote/"+symbol+"/";
        var end_url="?s="+symbol;
        var url=begin_url+query.name+end_url;
        const currPromise = new Promise((resolve, reject) => {
            console.log("Beginning promise "+url);
            GM_xmlhttpRequest({method: 'GET', url: url,
            onload: function(response) { query.parser(response,resolve,reject); },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
            });

        });
        currPromise.then(query.callback
                         )
            .catch(function(val) {
            console.log("Failed at this yahooqueryPromise " + val); GM_setValue("returnHit",true); });
        return currPromise;
    }

    function parse_quoteheader(quoteheader)
    {
        console.log("In parse_quoteheader");
        var i;
        var mt,fz;
        var curr_regex=/Currency in (.*)$/,curr_match;
        try
        {
            mt=quoteheader.getElementsByClassName("Mt(15px)")[0];
            fz=mt.getElementsByClassName("Fz(12px)")[0];
            curr_match=fz.innerText.match(curr_regex);
            console.log("fz.innerText="+fz.innerText+", curr_match="+curr_match);
            if(curr_match) { my_query.results.Currency=curr_match[1];
                           my_query.done.Currency=true;
                           }
        }
        catch(error) { console.log("error in parse_quoteheader="+error); }
    }

    function parse_units(Main)
    {
        console.log("In parse_units");
        var unit_regex=/All numbers in (.*)$/,unit_match;
        var unit_map={"dollars":"D","thousands":"K","millions":"M","billions":"B"};
        try
        {
            var x=Main.getElementsByClassName("Fz(xs)")[0];
            unit_match=x.innerText.match(unit_regex);
            if(unit_match && unit_map[unit_match[1].toLowerCase()]!==undefined)
            {
                my_query.results.Unit=unit_map[unit_match[1].toLowerCase()];
                my_query.done.Unit=true;
            }
        }
        catch(error) { console.log("error in parse_units="+error); }
    }

    function parse_financials(response,resolve,reject)
    {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_financials\n"+response.finalUrl);
//        var the_div=doc.getElementById("Col1-1-Financials-Proxy");
        var quoteheader=doc.getElementById("quote-header-info");
        var Main=doc.getElementById("Main");
        var the_div=doc.getElementsByClassName("Ovx(a)"),table,i,j,curr_row,curr_label,curr_val;
        if(quoteheader) parse_quoteheader(quoteheader);
        if(Main) parse_units(Main);


        if(the_div.length===0) { reject("Failed to find div"); return; }
    //    console.log("the_div.length="+the_div.length);
        table=the_div[0].getElementsByTagName("table");
        if(table.length===0) { reject("Failed to find table"); return; }
        table=table[0];
        for(i=0; i < table.rows.length; i++)
        {
            curr_row=table.rows[i];

            curr_label=curr_row.cells[0].innerText;
            //console.log("curr_row="+curr_row.innerText+"\ncurr_label="+curr_label);
            curr_val="NA";
            if(curr_row.cells.length>1)
            {
                curr_val="0";
                for(j=1; j < curr_row.cells.length; j++)
                {
                    if(curr_row.cells[j].innerText!=="-")
                    {
                        curr_val=curr_row.cells[j].innerText;
                        break;
                    }
                }
            }
            if(/Total Revenue/.test(curr_label))
            {

                my_query.results["2017 Revenue"]=curr_val;//curr_row.cells.length>1?curr_row.cells[1].innerText : "N/A";
                my_query.done["2017 Revenue"]=true;
            }
            else if(/Research Development/.test(curr_label))
            {
                my_query.results["2017 R&D Expense"]=curr_val; //curr_row.cells.length>1?curr_row.cells[1].innerText : "N/A";
                if(my_query.results["2017 R&D Expense"].trim()==="-") { my_query.results["2017 R&D Expense"]="0"; }
                my_query.done["2017 R&D Expense"]=true;
            }
            else if(/Operating Income or Loss/.test(curr_label))
            {
                my_query.results["2017 Operating Income"]=curr_val;//curr_row.cells.length>1?curr_row.cells[1].innerText : "N/A";
                my_query.done["2017 Operating Income"]=true;
            }


        }
        resolve("Done parse financials");


    }
    function parse_key(response,resolve,reject)
    {
         var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_key\n"+response.finalUrl);
        var i,j;
        var stats=doc.getElementsByClassName("table-qsp-stats");
        var success=false;
        for(i=0; i < stats.length; i++)
        {
            if(stats[i].previousElementSibling && /Stock Price History/.test(stats[i].previousElementSibling.innerText))
            {
                for(j=0; j < stats[i].rows.length; j++)
                {
                    if(/^52-Week/.test(stats[i].rows[j].cells[0].innerText))
                    {
                        my_query.results["52-week Stock Price Change %"]=stats[i].rows[j].cells[1].innerText.replace(/\s*%/,"");
                        success=true;
                        break;
                    }
                }
                if(success) break;
            }
        }
        if(success)
        {
            my_query.done["52-week Stock Price Change %"]=true;
            resolve("Done parse key");
        }

    }

    function is_done()
    {
        var i,is_done=true;
        for(var x in my_query.done) {
            console.log("my_query.done["+x+"]="+my_query.done[x]);
            is_done=is_done & my_query.done[x]; }
        return is_done;
    }

   /* function shorten_company_name(name)
    {
        name=name.replace(/ - .*$/,"").trim().replace(/\s*plc$/i,"");
        name=name.replace(/\(.*$/i,"").trim();
        name=name.replace(/\s*Corporation$/i,"").replace(/\s*Corp\.?$/i,"");
        name=name.replace(/\s*Incorporated$/i,"").replace(/\s*Inc\.?$/i,"");
        name=name.replace(/\s*LLC$/i,"").replace(/\s*Limited$/i,"").replace(/\s*Ltd\.?$/i,"").trim();
        
        name=name.replace(/,\s*$/,"").replace(/ Company$/,"");
        name=name.replace(/\s+Pte$/,"").replace(/ AG$/,"");
        name=name.replace(/\s+S\.?A\.?$/,"").replace(/\s+L\.?P\.?$/,"");

        return name;
    }*/

    function remove_country(name)
    {
        console.log("name="+name);
        var countries=["Hong Kong","USA","UK"];
        var regexp,i;
        for(i=0; i < countries.length; i++)
        {
            regexp=new RegExp(countries[i]+"$");
            console.log("regexp="+regexp);
            name=name.replace(regexp,"");
        }
        return name;
    }


    function init_Query()
    {
        var exch_list={"XTRA":".DE","TSX":".TO","SWX":".SW","LSE":".L","DB":".DE","SEHK":".HK","OM":".ST","SGX":".SI"},x;
        var well=document.getElementsByClassName("well");
        //var exchtick=well[1].innerText.split("_");
        //var wT=document.getElementById("workContent").getElementsByTagName("table")[0],x;
        my_query={given_name:removeDiacritics(well[0].innerText),query_tries:0,exchange:"",ticker:""};

        //ticker=exchtick[1].trim(), exchange=exchtick[0].trim()

        my_query.name=remove_country(my_query.given_name);
        my_query.name=shorten_company_name(my_query.name).replace(/\s*Co\.?$/,"").trim().replace(/\s+Sarl$/i,"").replace(/[,\.]+$/,"").trim();
        my_query.done={"2017 R&D Expense":false,"2017 Revenue":false,"2017 Operating Income":false,
                       "AUM":false,"Currency":false,"Unit":false}; //"52-week Stock Price Change %":false,
        my_query.results={};
        if(exch_list[my_query.exchange]!==undefined) my_query.ticker=my_query.ticker+exch_list[my_query.exchange];


        for(x in my_query.done) my_query.results[x]="";

        my_query.results.AUM="NA";
        my_query.done.AUM=true;

        for(x in my_query.results)
            {
                if(document.getElementById(x)) document.getElementById(x).type="text";
            }

        console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.given_name+" site:bloomberg.com/profiles/companies";
        const bloomPromise = new Promise((resolve, reject) => {
            console.log("Beginning Wiki search");
            query_search(search_str, resolve, reject, bloom_response);
        });
        bloomPromise.then(bloom_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this wikiPromise " + val); GM_setValue("returnHit",true); });





    }

    function do_sec()
    {
        console.log("Doing sec");
        var firm=document.getElementById("ctl00_cphMain_sbox_txtFirm");
        var button=document.getElementById("ctl00_cphMain_sbox_searchBtn");
        var results=document.getElementsByClassName("bcsearchresultfirstcol");
        var radio=document.getElementById("ctl00_cphMain_sbox_rdoFirm");
        var resultpanel=document.getElementsByClassName("result-panel");
         if(!firm) return;
        console.log("firm="+firm);
        radio.click();
        setTimeout(function() {
            firm.value=my_query.name;
            if(results.length===0) {
                if(resultpanel.length>0 && /^No match has been found for the information you provided/.test(resultpanel[0].innerText))
                {
                    setTimeout(do_sec2, 1500);
                }
                else
                {
                    button.click();
                }


            }
            console.log("Have results");
            parse_sec();
        }, 250);
    }

    function parse_sec()
    {
        var results=document.getElementsByClassName("bcsearchresultfirstcol");
        var link,url;
        var displayName,names;
        console.log("in parse_sec");
        var i;
        for(i=0; i < results.length; i++)
        {
            displayName=results[i].getElementsByClassName("displayname")[0].innerText.toLowerCase();
            names=results[i].getElementsByClassName("names")[0].innerText.toLowerCase();
            console.log("displayName="+displayName+", names="+names);
            link=results[i].parentNode.parentNode;
            url=link.href.replace(/https?:\/\/[^\/]+\//,"https://www.adviserinfo.sec.gov/");
            console.log("url="+url);
            if(displayName.indexOf(my_query.name.toLowerCase())!==-1 || names.indexOf(my_query.name.toLowerCase())!==-1)
            {
                console.log("Success!!!!");
                return;
            }
        }
        setTimeout(do_sec2,3000);
    }


    function do_sec2()
    {
                console.log("Doing sec2");

        var firm=document.getElementById("ctl00_cphMain_sbox_txtFirm");
        var button=document.getElementById("ctl00_cphMain_sbox_searchBtn");
        var results=document.getElementsByClassName("bcsearchresultfirstcol");
         if(!firm) return;
        console.log("firm="+firm);

        firm.value="";
         button.click();
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
        if(!submitButton.disabled && GM_getValue("req_id","")==="A5RWGQ6JM688X")
        {

            init_Query();
        }

    }
    else if(window.location.href.indexOf("adviserinfo.sec.gov")!==-1)
    {
        if(window.location.href.indexOf("/IAPD/content")!==-1)
        {
        }
        else if(window.location.href.indexOf("/IAPD/"!==-1))
        {
            GM_setValue("my_query",{});
            GM_addValueChangeListener("my_query",function() {
                console.log("Doing my_query="+JSON.stringify(arguments[2]));
                my_query=arguments[2];
                do_sec();

            });
        }
    }
    else if(window.location.href.indexOf("worker.mturk.com")!==-1)
    {

	/* Should be MTurk itself */

        var globalCSS = GM_getResourceText("globalCSS");
        GM_addStyle(".btn-ternary { border: 1px solid #FA7070; background-color: #FA7070; color: #111111; }");
       var pipeline=document.getElementsByClassName("work-pipeline-action")[0];
        var detail_a=document.getElementsByClassName("project-detail-bar")[0].children[0]
        .children[1].getElementsByClassName("detail-bar-value")[0].getElementsByTagName("a")[0];
        var req_id=detail_a.href.match(/requesters\/([^\/]+)/);
        if(req_id && req_id[1]==="A5RWGQ6JM688X")
        {
            GM_setValue("req_id",req_id[1]);
        }
        else { console.log("Wrong site for Cathy"); return; }
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
