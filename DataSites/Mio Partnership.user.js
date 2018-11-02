// ==UserScript==
// @name         Mio Partnership
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
    var bad_urls=["facebook.com","linkedin.com","twitter.com","en.wikipedia.org",".gov/","yahoo.com","thefreedictionary.com"];
    var show_urls=["www.showsbee.com/","www.eventseye.com/","www.totalexpo.ru/","www.eventegg.com","tsnn.com/",
                  "tradefairdates.com","expohour.com/","10times.com/","feiinc.com/","festivalnet.com/","tradeshowz.com",
                  "ntradeshows.com","tradekey.com","expodatabase.com","tradeindia.com"];//"kompass.com"];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var first_try=true;

    function is_bad_url2(the_url, bad_urls, pos)
    {
        var i;


        for(i=0; i < bad_urls.length; i++)
        {
            if(the_url.indexOf(bad_urls[i])!==-1) return true;
        }

        return false;
    }
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
            setTimeout(function() { document.getElementById("submitButton").click(); }, 200);
        }
    }
    function is_bad_name(b_name,p_caption,pos,query_pos)
    {

       // console.log("b_name="+b_name);
        var good_count=0;
        b_name=b_name.replace(/\|.*$/,"").replace(/ - .*$/).trim();

        //b_name.replace(/\([^\)]+\)/,"")
        console.log("is_bad_name: b_name="+b_name);
        var name_split=my_query.name.toLowerCase().split(" "),i;
        if(b_name.toLowerCase().indexOf(my_query.name.toLowerCase())!==-1) return false;
        console.log("my_query.long_name="+my_query.long_name.toLowerCase());
        if(my_query.long_name.toLowerCase().indexOf(b_name.toLowerCase())!==-1) return false;
        for(i=0; i < name_split.length; i++)
        {
            if(b_name.toLowerCase().indexOf(name_split[i])!==-1) good_count++;
        }
        if(query_pos===0 && pos===0 && (good_count>=3 || good_count>=name_split.length-1)
          && b_name.toLowerCase().indexOf(name_split[0].toLowerCase())!==-1

          ) return false;

        if(query_pos===0 && p_caption.toLowerCase().indexOf(my_query.name.toLowerCase())!==-1) return false;
        for(i=0; i < my_query.acronym_list.length; i++)
        {
            if(b_name.indexOf(my_query.acronym_list[i])!==-1) return false;
        }
        let nospaceetc_bname=removeDiacritics(b_name.toLowerCase().replace(/[\'\s\u2018]+/g,""))
        let nospace_name=removeDiacritics(my_query.name.toLowerCase().replace(/[\'\s\u2018]+/g,""));
        console.log("nospaceetc_bname="+nospaceetc_bname+", nospace_name="+nospace_name);
         if(nospaceetc_bname.toLowerCase().indexOf(nospace_name)!==-1) return false;
        if(b_name.indexOf("ü")!==-1)
        {
            let b_name1=b_name.replace(/ü/g,"u");
            let b_name2=b_name.replace(/ü/g,"ue");
            if(!is_bad_name(b_name1,p_caption,pos,query_pos) || !is_bad_name(b_name2,p_caption,pos,query_pos)) return false;
        }

        return true;
    }

    function parse_org(response)
    {
         var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_org: "+response.finalUrl);
        var i,curr_href;
        for(i=0; i < doc.links.length; i++)
        {
            curr_href=doc.links[i].href;
            if(!/amazonaws/.test(curr_href))
            {

                console.log("curr_href["+i+"]="+curr_href);
            }
            if(/linkedin\.com\/.+/.test(curr_href) && !/linkedin\.com\/shareArticle\?/.test(curr_href)
              && !/linkedin\.com\/jobs\?/.test(curr_href))
            {
                my_query.out.LinkedInURL=curr_href;
                my_query.done_site[1]=true;
            }
            else if(/twitter\.com\/.+/.test(curr_href) && !/twitter\.com\/home\?/.test(curr_href)

                   && !/twitter\.com\/share\?/.test(curr_href) && !/twitter\.com\/intent\//.test(curr_href))
            {
                my_query.out.TwitterURL=curr_href;
                my_query.done_site[3]=true;
            }
            else if(/facebook\.com\/.+/.test(curr_href) && !/facebook\.com\/sharer\//.test(curr_href) && !/wordpress|wix/i.test(curr_href)
                   && !/facebook\.com\/sharer\.php/.test(curr_href) && !/facebook\.com\/dialog\//.test(curr_href)
                   )
            {
                my_query.out.FacebookURL=curr_href;
                my_query.done_site[2]=true;
            }
        }
        add_to_sheet();

        my_query.done_site[0]=true;
        if(is_done() && !my_query.submitted)
        {
            my_query.submitted=true;
            check_and_submit(check_function,automate);
        }

    }

    function parse_showsbee(response,resolve,reject) {
         var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_showsbee\n"+response.finalUrl);
        var table=doc.getElementsByTagName("table"),i;
        if(table.length>=4) table=table[3].getElementsByTagName("table");
        for(i=1; i < table.length; i++)
        {
            if(/Contact Us/.test(table[i].innerText)) break;
        }
        if(i < table.length) table=table[i];
        else { reject("Failed on showsbee table"); }
        for(i=0; i < table.rows.length; i++)
        {
            console.log("table.rows[i].innerText="+table.rows[i].innerText);
            if(table.rows[i].cells.length>0 && /Website:/.test(table.rows[i].cells[0].innerText))
            {
                resolve(table.rows[i].cells[1].innerText.trim());
                return;
            }
        }
        reject("Failed to find website in showsbee");

    }

    function parse_tsnn(response,resolve,reject) {
         var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_tsnn\n"+response.finalUrl);
        var url_field=doc.getElementsByClassName("field--name-field-url"),inner_a;
        if(url_field.length>0)
        {
            inner_a=url_field[0].getElementsByTagName("a");
            if(inner_a.length>0)
            {
                resolve(inner_a[0].href);
                return;

            }
        }
                console.log("Failed parse_tsnn");

        try_next_query(resolve,reject,0);
    }

     function parse_eventseye(response,resolve,reject) {
         var doc = new DOMParser()
         .parseFromString(response.responseText, "text/html");
         console.log("in parse_eventseye\n"+response.finalUrl);
           var inner_table,inner_a;
         var i,success=false,more;
         if(/fairs/.test(response.finalUrl))
         {
              more=doc.getElementsByClassName("more-info");
             if(more.length>0)
             {
                 inner_a=more[0].getElementsByTagName("a");
                 if(inner_a.length>0)
                 {
                     resolve(inner_a[0].href);
                     return;
                 }
             }


             //return;
         }
         for(i=0; i < doc.links.length; i++)
         {
             if(/Web Site/.test(doc.links[i].innerText))
             {
                 resolve(doc.links[i].href);
                 return;
             }
         }
      /*   var table=doc.getElementsByTagName("table");
         if(table.length<2) {console.log("Not enough tables in eventseye");

                             try_next_query(resolve,reject,0);
                             return; }

         inner_table=table[1].getElementsByTagName("table");

         for(i=0; i < inner_table.length; i++)
         {
             if(/Web Site/.test(inner_table[i].innerText)) { success=true; break; }
         }
         if(!success) { console.log("Failed to find table with website");
                       try_next_query(resolve,reject,0);
                       return; }
         inner_a=inner_table[i].getElementsByTagName("a");

         if(inner_a.length>0)
         {
             resolve(inner_a[0].href);
             return;

         }*/
        reject("Failed parse_eventseye");
    }


    function query_response(response,resolve,reject,pos) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
        var pos_name="URL";
        if(my_query.sites[pos].length>0)
        {
            pos_name=my_query.sites[pos].replace(/\s*site:/,"").replace(/\.com.*$/,"");
        }
        var b_url="crunchbase.com", b_name, b_factrow, b_caption;
        var b1_success=false, b_header_search,p_caption;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");

            console.log("b_algo.length="+b_algo.length);

            for(i=0; i < b_algo.length && i < 3; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");//[0].innerText;
                p_caption="";
                if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
                }
                console.log(pos_name+"("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);

                if((my_query.try_count>=2 && my_query.try_count<=3) &&
                   !is_bad_name(b_name,p_caption,i,pos) && !is_bad_url2(b_url,show_urls,i) && !(pos===0 && is_bad_url(b_url,bad_urls)))
                {
                    b1_success=true;
                    break;

                }
                else if((my_query.try_count<2 || my_query.try_count>3) && !is_bad_name(b_name,p_caption,i,pos))
                {
                    b1_success=true;
                    break;
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
        if(b1_success && (pos>0 || my_query.try_count>=2 && my_query.try_count<=3))
        {
            /* Do shit */
            resolve(b_url);
            return;
        }
        else if(b1_success && my_query.try_count===4)
        {
            console.log("b1_success query");
            var comp_num_match=b_url.match(/-([\d]+)/);
            if(comp_num_match)
            {
                let new_url="https://www.showsbee.com/contact-"+comp_num_match[1]+".html";
                GM_xmlhttpRequest({method: 'GET', url: new_url,
                                   onload: function(response) { parse_showsbee(response,resolve,reject); },
                                   onerror: function(response) { console.log("Fail org page"); },
                                   ontimeout: function(response) { console.log("Fail org page"); }
                                  });
                return;
            }

        }
        else if(b1_success && my_query.try_count===0)
        {
            console.log("b1_success query tsnn");


            GM_xmlhttpRequest({method: 'GET', url: b_url,
                               onload: function(response) { parse_tsnn(response,resolve,reject); },
                               onerror: function(response) { console.log("Fail org page"); check_and_submit(check_function); },
                               ontimeout: function(response) { console.log("Fail org page"); }
                              });
            return;

        }
        else if(b1_success && my_query.try_count===1)
        {
            console.log("b1_success query  eventseye");


            GM_xmlhttpRequest({method: 'GET', url: b_url,
                               onload: function(response) { parse_eventseye(response,resolve,reject); },
                               onerror: function(response) { console.log("Fail org page");  check_and_submit(check_function);  },
                               ontimeout: function(response) { console.log("Fail org page"); }
                              });
            return;

        }




        if(pos===0)
        {
           try_next_query(resolve,reject,pos);
            return;
        }
            /*   else
        {
            if(my_query.site_try_count[pos]++===0)
           {
               query_search(my_query.name+my_query.sites[pos],resolve,reject,query_response,pos);
           }
            return;
        }*/

        console.log("Nothing found");
        my_query.done_site[pos]=true;
        if(is_done() && !my_query.submitted)
        {
            my_query.submitted=true;
            check_and_submit(check_function);
        }

        //        GM_setValue("returnHit",true);
        return;

    }

    function try_next_query(resolve,reject,pos)
    {
        console.log("my_query.try_count="+my_query.try_count);
        var name_str;
        if(my_query.exact) name_str="+\""+my_query.name+"\"";
        else name_str=my_query.name;
        if(my_query.try_count===0)
        {
            my_query.try_count++;
            console.log("Doing 0");
            query_search(name_str+" site:eventseye.com",resolve,reject,query_response,pos);
            return;
        }
        if(my_query.try_count===1)
        {
            my_query.try_count++;
            console.log("Doing 1");
            query_search(name_str+" ",resolve,reject,query_response,pos);
            return;
        }
        else if(my_query.try_count===2)
        {
            my_query.try_count++;
            console.log("Doing 2");
            query_search(name_str+" trade shows",resolve,reject,query_response,pos);
            return;
        }
        else if(my_query.try_count===3)
        {
            my_query.try_count++;
            console.log("Doing 3");
            query_search(name_str+" site:showsbee.com",resolve,reject,query_response,pos);
            return;
        }
        else
        {
            reject("Failed to find");
        }

    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,i) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
	    encodeURIComponent(search_str)+"&first=1&rdr=1";
	GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
            onload: function(response) { callback(response, resolve, reject,i); },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
            });
    }

    /* Following the finding the district stuff */
    function query_promise_then(url) {
        console.log("*** found url="+url);
        if(/facebook\.com\//.test(url))
        {
            my_query.out.FacebookURL=url;
            my_query.done_site[2]=true;
        }
        else if(/twitter\.com\//.test(url))
        {
           my_query.out.TwitterURL=url;
            my_query.done_site[3]=true;
        }
        else if(/linkedin\.com\//.test(url))
        {
            my_query.out.LinkedInURL=url;
            my_query.done_site[1]=true;
        }
        else
        {
            my_query.out.OrganiserURL=url.replace(/(https?:\/\/[^\/]+)\/.*$/,"$1");
            add_to_sheet();
            GM_xmlhttpRequest({method: 'GET', url: my_query.out.OrganiserURL,
            onload: function(response) { parse_org(response); },
            onerror: function(response) { console.log("Fail org page");  check_and_submit(check_function);  },
            ontimeout: function(response) { console.log("Fail org page"); }
            });
            return;
        }
        console.log("my_query.done_site="+JSON.stringify(my_query.done_site));
        add_to_sheet();
        if(is_done() && !my_query.submitted)
        {

            my_query.submitted=true;
            check_and_submit(check_function,automate);
        }



    }

    function add_to_sheet()
    {
        var x;
        for(x in my_query.out)
        {
            document.getElementById(x).value=my_query.out[x];
        }
    }


    function is_done()
    {
        var is_done=true;
        for(var i=0; i < my_query.done_site.length; i++) is_done=is_done & my_query.done_site[i];
        return is_done;
    }

    function get_acronym_list(name)
    {
        var ret=[],i,j;
        var name_split=name.split(" ");
        ret[0]="";
        for(i=0; i < name_split.length; i++)
        {
            if(/^[A-Z]+/.test(name_split[i])) ret[0]=ret[0]+name_split[i].charAt(0)
        }
        let new_ret=ret[0];
        for(i=0; i < new_ret.length; i++)
        {
            if(i<new_ret.length-1 && ret[0].charAt(i+1)===new_ret.charAt(i))
            {
                j=i+1;
                while(j<new_ret.length && ret[0].charAt(j)==new_ret.charAt(i)) j++;
                new_ret=new_ret.substr(0,i)+new_ret.charAt(i)+(j-i)+new_ret.substr(j);
            }
        }
        if(new_ret!==ret[0]) ret.push(new_ret);
        console.log("acronym_list="+JSON.stringify(ret));

        return ret;
    }
    function init_Query()
    {
        var dont=document.getElementsByClassName("dont-break-out")[0].innerText,i;

        //var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        my_query={name:dont,long_name:dont, sites:[""," site:linkedin.com/company"," site:facebook.com"," site:twitter.com"],done_site:[],out:
                  {"OrganiserURL":"","LinkedInURL":"","FacebookURL":"","TwitterURL":""},
                 out_list:["OrganiserURL","LinkedinURL","FacebookURL","TwitterURL"],submitted:false,acronym:"",try_count:0,
                  site_try_count:[0,0,0,0],exact:false
                 };
        if(/\([^\)]+\)$/.test(my_query.name))
        {
            my_query.name=my_query.name.match(/\(([^\)]+)\)$/)[1];
            my_query.exact=true;
        }
        my_query.name=shorten_company_name(my_query.name.replace(/\s+GMBH$/i,"").replace(/\s+SRL$/i,"").replace(/\sAŞ$/,""));
        my_query.acronym_list=get_acronym_list(my_query.long_name);

        my_query.first=my_query.name.split(" ")[0];
        var promise_list=[];
        console.log("my_query="+JSON.stringify(my_query));
        for(i=0; i < my_query.sites.length; i++)
        {
            my_query.done_site[i]=false;
            promise_list.push(create_promise(i));
        }







    }

    function create_promise(i)
    {
        var search_str;
        if(!my_query.exact)
        {
            if(i===0) search_str=my_query.name+" site:tsnn.com";
            else search_str=my_query.name+my_query.sites[i];
        }
        else
        {
            if(i===0) search_str="+\""+my_query.name+"\" site:tsnn.com";
            else search_str="+\""+my_query.name+"\""+my_query.sites[i];
        }
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,i);
        });
        queryPromise.then(query_promise_then
                         )
            .catch(function(val) {
            console.log("Failed at this queryPromise " + my_query.sites[i]+", "+val); GM_setValue("returnHit",true); });
        return queryPromise
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
                }, 26000);
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
