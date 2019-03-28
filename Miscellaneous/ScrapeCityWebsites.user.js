// ==UserScript==
// @name         ScrapeCityWebsites
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
// @author       You
// @include http*trystuff.com*
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/jacobsscriptfuncs.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/6fd21a45b9ab4fe06760c96aec34c0ff366e02fb/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=["zillow.com","facebook.com","ballotpedia.org","weather.gov","localtown.us","yellowpages.com","mayor-of.com","/?","themayorof.com",
                 "hauntedplaces.org",".aarp.org","apartmenthomeliving.com",".arkansas.com","local.arkansas.gov",".k12.","www.idaho.gov","twitter.com",
                 "newslocalnews.com","charters.delaware.gov","instagram.com","babysitterga.com","movingideas.org","theroute-66.com",
                 "citywideinformation.com",".opendi.us","www.usa.com","kids.kiddle.co","freecampsites.net"];
  //  var MTurk=new MTurkScript(20000,200,[],begin_script,"[TODO]");
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name,p_caption,search_str,b_url)
    {
        var b_split=b_name.split(/\s+[\|\-]\s+/),i,x;
        var search_str_begin=search_str.replace(/\s*,.*$/,"").replace(/\s/g,"");
        var lst=[" School"," Resort"," Communications"," Clinic","Historic Site"," Company"," Law Firm", "Furniture"],temp_regexp;
        if(/not-for-profit/.test(p_caption)) return true;
        for(i=0;i<lst.length;i++) {
            temp_regexp=new RegExp(lst[i]);
            if(temp_regexp.test(b_name) && !temp_regexp.test(search_str)) return true; }
        search_str=search_str.replace(/\s*,.*$/,"");
        if(/(chamber\.(org|com))|(chamberofcommerce)|(\.edu)/.test(b_url)) return true;
        if(/(^|[^A-Za-z]+)(CUSD|County|home center|Bank of|Motors|Hotel|Inc\.|Travel Information|School|Recycling)($|[^A-Za-z]+)/i.test(b_name)) return true;
        if(/(^|[^A-Za-z]+)(Apartment Home|unofficial site)($|[^A-Za-z]+)/i.test(p_caption)) return true;
        for(x in reverse_state_map) {
            if(x===Stuff.state) continue;
            if(new RegExp(search_str_begin+"(-)?"+x,"i").test(b_url)||new RegExp(search_str_begin+"(-)?"+reverse_state_map[x],"i").test(b_url)) return true;
            if(new RegExp("(^|[^A-Za-z]+)"+x+"($|[^A-Za-z]+)").test(b_name)) return true;
            if(new RegExp(",\\s*"+reverse_state_map[x]+"($|[^A-Za-z]+)").test(b_name)) return true;
            if(new RegExp("\\."+x+"\\.us","i").test(b_url)) return true;
        }
        for(i=0;i<b_split.length;i++) {
            if(MTP.matches_names(search_str,b_split[i])) return false;
        }


        return true;
    }

    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0;
        if(callback===undefined) callback=init_Query;
        if(MTP!==undefined) { callback(); }
        else if(total_time<2000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }

    function query_promise(search_str) {
        const promise=new Promise((resolve,reject) => {
            query_search(search_str,resolve,reject,query_response,0);
        }).then(query_promise_then);
        return promise;

    }




    function query_response(response,resolve,reject,search_str,try_count) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
      //  console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a,x;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
          //  console.log("b_algo.length="+b_algo.length);
            if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
            //    console.log("parsed_context="+JSON.stringify(parsed_context));
                if(parsed_context.url && !MTP.is_bad_url(parsed_context.url.replace(/\/$/,""),bad_urls,4,2) &&
                   (resolve({name:search_str,url:parsed_context.url})||true)) return;
            }
/*            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }*/
            for(i=0; i < b_algo.length&&i<5; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption="";
                if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
                }
                //
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls,4,2) && !is_bad_name(b_name,p_caption,search_str,b_url))
                {
                    console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                    b1_success=true;
                    break;

                }

            }
            if(b1_success)
            {
                /* Do shit */
                resolve({url:b_url,name:search_str});
                return;
            }
        }
        catch(error)
        {
            reject(error);
            return;
        }
        if(try_count===0) query_search(search_str.replace(/\s[a-z\s]+$/,"").trim(),resolve,reject,query_response,1);
        //reject("Nothing found");
        //        GM_setValue("returnHit",true);
        return;

    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject,callback,try_count) {
        //console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,search_str,try_count); },
                           onerror: function(response) { reject("Fail"); },
                           ontimeout: function(response) { reject("Fail"); }
                          });
    }

    function query_promise_then(result) {
        console.log(result.name.replace(/\s[a-z\s]+$/,"").replace(/\(.*$/,"").trim()+"|"+result.url);
    }



    var Stuff={wiki_url_list:[],promise_list:[],url_list:[],no_url_list:[]};
    Stuff.do_UT=function(doc,url,resolve,reject) {
        var lst=doc.querySelectorAll(".cityColumn a"),i;
        var str="";
        for(i=0;i<lst.length;i++) {
            str=str+lst[i].href+"<br>"; }
        document.body.innerHTML=str;
    };
    Stuff.do_MO=function(doc,url,resolve,reject) {
        console.log("url="+url);
        var lst=doc.querySelectorAll(".entry-content p a"),i;
        var str="";
        for(i=0;i<lst.length;i++) {
            if(lst[i].href.length===0 || /\/#$/.test(lst[i].href)) continue;
            str=str+lst[i].href+"<br>"; }
        document.body.innerHTML=str;
    };
    Stuff.get_wiki_table=function(table,url) {
        var col=0,i,row,a;
        if(table.rows.length>0) {
            for(i=0;i<table.rows[0].cells.length;i++) if(/Name|City|Municipality/i.test(table.rows[0].cells[i].innerText) && ((col=i)||true)) break;
        }

        for(i=1;i<table.rows.length;i++) {
            row=table.rows[i];
            if(row.cells.length>col && (a=row.cells[col].querySelector("a"))) {
                a.href=MTP.fix_remote_url(a.href,url);
                //console.log("a.innerText="+a.innerText+", url="+a.href);
                Stuff.wiki_url_list.push(a.href);
            }
        }
    }
    Stuff.get_alphabetical_list=function(doc,url,resolve,reject) {
        var alpha_list=doc.getElementById("Alphabetical_listing"),city_list,alpha_iter,a_lst;
        if(!alpha_list) return false;
        alpha_iter=alpha_list.parentNode.nextElementSibling;
        console.log("in get_alphabetical_list");
        while(alpha_iter && (alpha_iter.tagName!=="H2")) {
            if(/toc/.test(alpha_iter.className) && ((alpha_iter=alpha_iter.nextElementSibling)||true)) continue;
            a_lst=alpha_iter.querySelectorAll("a");
            a_lst.forEach(function(elem) {
                 elem.href=MTP.fix_remote_url(elem.href,url);
                //console.log("a.innerText="+a.innerText+", url="+a.href);
                Stuff.wiki_url_list.push(elem.href);
                          });
            alpha_iter=alpha_iter.nextElementSibling;
        }
        return true;

    };
    Stuff.parse_wiki_cities_list=function(doc,url,resolve,reject) {
        var increment=50;
        //console.log("in parse_wiki_cities_list,url="+url);
         var table=doc.querySelector(".wikitable.sortable"),row,i,a,full_promise_list=[],alpha;

        if(!(alpha=Stuff.get_alphabetical_list(doc,url,resolve,reject)) && !table) {
            reject("No sortable table found ");
            return; }
        else if(!alpha) Stuff.get_wiki_table(table,url);
        var timeout_function=function(i,resolve,reject) {
            var promise_list=[];
            for(var j=i*increment;j<(i+1)*increment&&j<Stuff.wiki_url_list.length;j++) {
                promise_list.push(MTP.create_promise(Stuff.wiki_url_list[j],Stuff.parse_wiki_page,MTP.my_then_func,MTP.my_catch_func));
            }
            Promise.all(promise_list).then(function() { resolve(""); });

        };
        for(i=0;i*increment<Stuff.wiki_url_list.length;i++) {
            full_promise_list.push(new Promise((resolve,reject) => {
            setTimeout(timeout_function
            ,1000*i,i,resolve,reject); }));
        }
        Promise.all(full_promise_list).then(Stuff.search_other_urls);
    };
    Stuff.parse_wiki_page=function(doc,url,resolve,reject) {

       // reject("");
        var table=doc.querySelector(".infobox.geography"),row,i,a,fn,pop=0,in_pop=false,done_website=false,str="",name,website="";
        if(!table &&(resolve()|1)) return;
        for(i=0;i<table.rows.length;i++) {
            fn=table.querySelector(".fn");
            name=fn.innerText.replace(/^.*\sof\s/,"").replace(/,.*$/,"")+", "+reverse_state_map[Stuff.state];
            row=table.rows[i];
            if(in_pop && row.className==="mergedtoprow") in_pop=false;
            if(row.cells.length>0 && /Population/.test(row.cells[0].innerText)) in_pop=true;
            if(row.cells.length<2) continue;
            if(in_pop&&/Total|City|State Capital|Town|Home Rule Municipality/i.test(row.cells[0].innerText)) pop=row.cells[1].innerText.replace(/(\d)\s+.*$/,"$1");
            if(/Website/i.test(row.cells[0].innerText) &&
               (a=row.cells[1].querySelector("a"))) { website=a.href; }
            else if((row=table.rows[i]) && row.cells.length>1&&/Website/i.test(row.cells[0].innerText) && (done_website=true))
                { website=row.cells[1].innerHTML; }
        }
        if(website.length>0&&!/web\.archive\.org/.test(website) && (done_website=true)) {
            str=website+"|"+name+"|"+pop; }
        if(!done_website) {
            Stuff.no_url_list.push(name+(/,/.test(name)?"":(", "+reverse_state_map[Stuff.state])));
            str="|"+name+"|"+pop; }
        document.body.innerHTML=document.body.innerHTML+str+"<br>";
        resolve();
    }

    Stuff.search_other_urls=function() {
        var promise_list=[],i;
        console.log("in Stuff.search_other_urls");
        for(i=0;i<Stuff.no_url_list.length;i++) {
            //console.log("search_str="+Stuff.no_url_list[i]);
            promise_list.push(query_promise(Stuff.no_url_list[i]+" (city OR town OR village) website"));
        }
    };


    function init_Query()
    {
        document.body.innerHTML="";
        console.log("in init_query");
        var state_query_map={"MO":"https://www.mo.gov/government/city-county-government/cities-and-municipalities/","UT":"http://www.ulct.org/about/links-to-utahs-cities-and-towns/"};
        var state="NE";
        Stuff.state=state;

       // var promise=MTurkScript.prototype.create_promise(state_query_map[state],Stuff["do_"+state],MTurkScript.prototype.my_then_func,MTurkScript.prototype.my_catch_func);
        var url="https://en.wikipedia.org/wiki/List_of_cities_in_"+(reverse_state_map[state]).replace(/\s/g,"_");
        if(state==="GA") url="https://en.wikipedia.org/wiki/List_of_municipalities_in_Georgia_(U.S._state)";
        console.log("url="+url);
        var wiki_promise=MTP.create_promise(url,Stuff.parse_wiki_cities_list,MTurkScript.prototype.my_then_func,MTurkScript.prototype.my_catch_func);

    }
    begin_script();

})();