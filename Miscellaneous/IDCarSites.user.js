// ==UserScript==
// @name         IDCarSites
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include        http*trystuff.com*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include file://*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_addValueChangeListener
// @grant GM_setClipboard
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Miscellaneous/DQInternal.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=["www.niche.com","www.greatschools.org","www.publicschoolreview.com",".facebook.com","local.yahoo.com",".yelp.com",
                  "//themotoring.com",".youtube.com",".vimeo.com","fltplan.com",".themotoring.com","spokeo.com","trystuff.com","twitter.com",
                 ".indeed.com",".zillow.com",".opendi.us"];


    //var MTurk=new MTurkScript(20000,200,[],init_Query,"[TODO]");
    function is_bad_name(b_name) {
	return false;
    }

    function query_response(response,resolve,reject,pos) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
       // console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a,parse_lgb;
        var name=decodeURIComponent(response.finalUrl.match(/\?q\=([^&]+)/)[1]).replace(new RegExp(" "+my_query.state+"$"),"");
       // console.log("name="+name);
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption,b1_success=false, b_header_search,b_context,parse_context;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            if(b_context) {
                parse_context=MTurkScript.prototype.parse_b_context(b_context);
                if(parse_context.Website && !MTurkScript.prototype.is_bad_url(parse_context.Website,bad_urls,5)) {
                  //  console.log("Found in b_context: "+parse_context.Website);
                    resolve({name:name,url:parse_context.Website});
                    return;
                }
            }
            if(lgb_info && (parse_lgb=MTurkScript.prototype.parse_lgb_info(lgb_info)) && parse_lgb.url &&
              !MTurkScript.prototype.is_bad_url(parse_lgb.url,bad_urls,5)) {
                resolve({name:name,url:parse_lgb.url});
                return;
            }
          //  console.log("b_algo.length="+b_algo.length);
            for(i=0; i < b_algo.length && i < 4; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption="";
                if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
                }
           //     console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!MTurkScript.prototype.is_bad_url(b_url,bad_urls,4,3) && !is_bad_name(b_name))
                {
                    b1_success=true;
                    break;
                }

            }
            if(b1_success)
            {
                /* Do shit */
                resolve({name:name,url:b_url});
                return;
            }


        }
        catch(error)
        {
            reject(error);
            return;
        }
        reject("Nothing found");
        //        GM_setValue("returnHit",true);
        return;

    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,i) {
      //  console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
	    encodeURIComponent(search_str)+"&first=1&rdr=1";
	GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
            onload: function(response) { callback(response, resolve, reject,i); },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
            });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        my_query.totalDealers++;
        var promise=MTurkScript.prototype.create_promise(result.url,DQ.init_DQ,done_dealer,my_catch_func,result.name);
    }
    function my_catch_func(response) {
        console.log("Failed to load");
        done_dealer();
     
    }

    function done_dealer(result) {
        my_query.doneDealers++;
        var x,i;
        console.log("doneDealers="+my_query.doneDealers);
        if(my_query.doneDealers>=my_query.totalDealers) {
           //print_failedQueries();
            //console.log("\nDealers:");
            print_dealers();
            //console.log("my_query.district_list="+JSON.stringify(my_query.district_list));
        }

    }
    function print_dealers() {
        var x,i,temp_set
        var regex_str="^(allautonetwork|assets-cdk|auction123|auto(conx|corner|funds|jini|manager|motiveleads|revo|salesweb|searchtech)|"+
            "car(base|sforsale)|"+
        "dealer(|carsearch|click|eprocess|fire|inspire|on|sync|scloud|solutionssoftware|spike|websites)|drivedominion|ebizautos|"+
            "fzautomotive|hasyourcar|higherturnover|jazelauto|jdbyrider|kukui|lotwizard|"+
            "motorcarmarketing|waynereaves|yourcarlot|v12software)$";
        var regex=new RegExp(regex_str,"i");
        for(x in my_query.dealer_obj) {
            if(regex.test(x)) continue;
            console.log("*** "+x+" ***");
            temp_set=new Set(my_query.dealer_obj[x]);
            for(let item of temp_set) {
                if(x==="none") console.log(item.url+"|"+item.name);
                else console.log(item.url);
            }
            /*for(i=0; i < my_query.dealer_obj[x].length; i++) {
                if(x==="none") console.log(my_query.dealer_obj[x][i].url+"; "+my_query.dealer_obj[x][i].name);
                else console.log(my_query.dealer_obj[x][i].url);
            }*/
        }
    }

    function print_failedQueries() {
        console.log("\n\n");
        var i;
        for(i=0; i < my_query.failed_list.length; i++) {
            console.log(my_query.failed_list[i].name+" "+my_query.failed_list[i].place);
        }
    }

    DQ.init_DQ=function(doc,url,resolve,reject,name) {
        var curr_page,curr_url,promise;
        console.log("init_DQ, url="+url);
        DQ.page_type=DQ.id_page_type(doc,url,resolve,reject);
        if(DQ.dealer_map[DQ.page_type]) DQ.page_type=DQ.dealer_map[DQ.page_type];
        console.log("page_type="+DQ.page_type);
 
        if(DQ.page_type==="none")
        {
            if(!DQ.try_carsforsale(doc,url,resolve,reject)) {
                console.log("Not cars for sale");
                if(my_query.dealer_obj[DQ.page_type]===undefined) my_query.dealer_obj[DQ.page_type]=[];
                my_query.dealer_obj[DQ.page_type].push({name:name,url:url});
            }


        }
        else {
            if(my_query.dealer_obj[DQ.page_type]===undefined) my_query.dealer_obj[DQ.page_type]=[];
            my_query.dealer_obj[DQ.page_type].push({name:name,url:url});
        }
        resolve("");

    };

    DQ.try_carsforsale=function(doc,url,resolve,reject) {
        var meta=doc.querySelector("meta[http-equiv='refresh']"),curr_page,curr_url,promise;
        if(meta) {
            console.log("meta.content="+meta.content);
            DQ.carSearchShit(DQ.param1,DQ.param2,DQ.param3,doc,url);
            DQ.page_type="carsforsale";

            if(my_query.dealer_obj[DQ.page_type]===undefined) my_query.dealer_obj[DQ.page_type]=[];
            my_query.dealer_obj[DQ.page_type].push({name:name,url:url});
            return true;
        }
        return false;
    };

DQ.id_page_type=function(doc,url,resolve,reject) {
        var page_type="none",i,match,src,copyright,item,links=doc.getElementsByTagName("link");
        var thei=doc.getElementsByTagName("iframe");
        for(i=0; i < doc.links.length; i++) {
            if((match=doc.links[i].href.match(DQ.dealer_regex)) &&
              (page_type=match[0].replace(/^.*\.www\./,"").replace(/\/\//,"").replace(/\.[^\.]*$/,"").toLowerCase()
               .replace(/[^\.]+\./,"").replace(/\./g,"_"))) return page_type;

        }
        for(i=0; i < doc.scripts.length; i++) {
           // if(doc.scripts[i].src) console.log("doc.scripts["+i+"].src="+doc.scripts[i].src);
            if(doc.scripts[i].src && (match=doc.scripts[i].src.match(DQ.dealer_regex)) &&
               (page_type=match[0].replace(/^.*\.www\./,"").replace(/\.[^\.]*$/,"").toLowerCase().replace(/\//g,"")
                .replace(/[^\.]+\./,"").replace(/\./g,"_"))) return page_type;
        }
        for(i=0; i < links.length; i++) {
             if(links[i].href && (match=links[i].href.match(DQ.dealer_regex)) &&
              (page_type=match[0].replace(/^.*\.www\./,"").replace(/\/\//,"").replace(/\.[^\.]*$/,"").toLowerCase()
               .replace(/[^\.]+\./,"").replace(/\./g,"_"))) return page_type; }
        for(i=0; i < thei.length; i++) {
            if(thei[i].src && (match=thei[i].src.match(DQ.dealer_regex)) &&
              (page_type=match[0].replace(/^.*\.www\./,"").replace(/\/\//,"").replace(/\.[^\.]*$/,"").toLowerCase()
               .replace(/[^\.]+\./,"").replace(/\./g,"_"))) return page_type; }


        if((copyright=doc.getElementsByClassName("copyrightProvider")).length>0
           && /FordDirect/.test(copyright[0].innerText)) return "FordDirect";
        if((copyright=doc.getElementById("footer-copyright")) &&
           /DealerDirect/.test(copyright.innerText)) return "FordDirect";
        if((copyright=doc.getElementsByName("copyright")).length>0
           && /^AutoCorner/i.test(copyright[0].content)) return "autocorner";
        if(doc.querySelector(".legacy-redirect")) return "waynereaves";

        if(/\.hasyourcar\./.test(url)) return "hasyourcar";
        return page_type;
    };

    function scrape_niada_page(doc,url,resolve,reject) {

        var table=doc.getElementById("member_directory_table_form").getElementsByTagName("table")[0],i,curr_row,info,address;
        for(i=0; i < table.rows.length; i++) {
            info=table.rows[i].cells[1].innerText.replace(/\n.*$/,"");
            address=table.rows[i].cells[2].innerText.replace(/\s*[\d-]+\s*$/,"");
            console.log("info="+info+", address="+address);
            my_query.dealer_list.push({name:info,place:address});

        }
        resolve("Done page");
    }

    function scrape_dealers() {
        var i;
        for(i=0; i < my_query.dealer_list.length; i++)
        {
            my_query.dealer_promise_list.push(create_dealer_promise(i));
        }
    }

    function create_dealer_promise(i) {
        var search_str=my_query.dealer_list[i].name+" "+my_query.dealer_list[i].place;
        const queryPromise = new Promise((resolve, reject) => {
               // console.log("Beginning URL search");
                query_search(search_str, resolve, reject, query_response);
            });
            queryPromise.then(query_promise_then).catch(function(val) {
                console.log("Failed at queryPromise "+i+", " + val);
                my_query.failed_list.push(my_query.dealer_list[i]);

            });
        //console.log("dealer_list["+i+"]=name: "+my_query.dealer_list[i].name+", place="+my_query.dealer_list[i].place);
        return queryPromise;

    }



    function scrape_niada(doc,url,resolve,reject) {
        var middle=doc.getElementsByClassName("te_paging_middle_cell"),i,last_page,match,temp_url;
        match=middle[0].innerText.match(/of ([\d]+)/);
        last_page=parseInt(middle[0].innerText.match(/of ([\d]+)/)[1]);
        console.log("middle[0].innerText="+middle[0].innerText+", match="+match);
        var begin_spot=10;
       for(i=begin_spot; i <= last_page && i < begin_spot+9; i++) {
           temp_url=url.replace(/pgNumber\=([\d]+)/,"pgNumber="+(i).toString());
           console.log("temp_url="+temp_url);
            my_query.scrape_promise_list.push(MTurkScript.prototype.create_promise(temp_url,
                                                                                   scrape_niada_page,
                                                                          MTurkScript.prototype.my_then_func)); }
       Promise.all(my_query.scrape_promise_list).then(scrape_dealers);
    }
    function scrape_dealerrater(doc,url,resolve,reject) {
        var i;
         var page_container=doc.getElementsByClassName("page_container")[0];
        var page_active=page_container.getElementsByClassName("page_active");
        var last_page=page_active[page_active.length-2].innerText;
        url=window.location.href;
        for(i=1; i <= last_page; i++) {
            my_query.scrape_promise_list.push(MTurkScript.prototype.create_promise(url.replace(/[\d]+$/,(i).toString()),scrape_page,
                                                                          MTurkScript.prototype.my_then_func)); }

        Promise.all(my_query.scrape_promise_list).then(scrape_dealers);
    }





    function init_Query()
    {
        var i,j;
        console.log("in init_query");
        my_query={state:"Virginia",dealer_obj:{},doneDealers:0,totalDealers:0,
                 scrape_promise_list:[],dealer_promise_list:[],dealer_list:[],failed_list:[]};
        var url="https://www.niada.com/member_directory.php?te_class=member_directory&te_mode=table&te_orderBy=&te_obDir=&te_pgNumber=1&state=";
        url=url+encodeURIComponent(my_query.state);
     //   var promise=MTurkScript.prototype.create_promise(url,scrape_niada,MTurkScript.prototype.my_then_func);

       

    }
    if(window.location.href.indexOf("trystuff.com")!==-1)
    {
        init_Query();
    }

})();