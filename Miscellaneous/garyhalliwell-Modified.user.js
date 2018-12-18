// ==UserScript==
// @name         garyhalliwell-Modified
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Find band
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/MTurkScript.js
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
    var bad_urls2=["sheetmusicdirect.com","lyricsbros.com","amazingwallpaperz.com"];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var first_try=true;

    var ctrl=document.getElementsByClassName("form-control");

    var search_list=[{site:"twitter.com",field:1},{site:"instagram.com",field:2},
                         {site:"bandcamp.com",field:3},{site:"facebook.com",field:0}];

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
    
    function is_bad_name(b_name,p_caption,pos)
    {
        b_name=b_name.replace(/\s-.*$/,"").replace(/\s\|.*$/,"");
        var field=pos>=0 && pos<search_list.length ? search_list[pos].field : "";
        console.log("*** field="+field);
        if(/bandcamp/.test(field)) b_name=b_name.replace(/^[^\|]+\|/,"").trim();
        var name=my_query.short_name.toLowerCase();
        var name_temp=my_query.short_name.toLowerCase().replace(/[-!\.\'\"\s]+/g,"").trim();
        var b_nametemp=removeDiacritics(b_name.replace(/[\s-!\.\'\"]+/g,"").toLowerCase().trim());
        console.log("name_temp="+name_temp+", b_nametemp="+b_nametemp+",b_nametemp.indexOf(name_temp)="
                   +b_nametemp.indexOf(name_temp));
        if(b_nametemp.indexOf(name_temp)!==-1) return false;
        console.log("not found");

        if(removeDiacritics(b_name).toLowerCase().indexOf(name)===-1 &&
           (/bandcamp|twitter|insta|facebook/.test(field) || removeDiacritics(p_caption).toLowerCase().indexOf(name)===-1)) return true;
        return false;
    }

    function is_bad_site(b_url,b_name,pos)
    {
        console.log("in is_bad_site "+b_url);
        if(/instagram\.com\/([^\/]+\/)?(p|explore)\//.test(b_url)) return true;
        if(/youtube\.com\/(user|channel)\//.test(b_url)) return true;
        if(/facebook\.com\/.*\/videos\/?$/.test(b_url)) return true;
       // if(/facebook\.com\/[^\/]+\./.test(b_url)) return true;
        if(/facebook\.com\/(events|groups)\//.test(b_url)) return true;
        if(/bandcamp\.com\/(artist_index\?|(tag)\/)/.test(b_url)) return true;
        if(/daily\.bandcamp\.com\//.test(b_url)) return true;
        if(/twitter\.com\/i\//.test(b_url)) return true;
        return false;
    }

    function query_response(response,resolve,reject,pos) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response \n"+response.finalUrl+"\ttry_count="+my_query.try_count[search_list[pos].field]);
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow, b_caption,p_caption;
        var b1_success=false, b_header_search;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
	    

            console.log("b_algo.length="+b_algo.length);
     
            for(i=0; i < b_algo.length && i < 3; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
		b_caption=b_algo[i].getElementsByClassName("b_caption");
		p_caption="";
		if(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) {
		    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText;
		}
		console.log(search_list[pos].field+":("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);



                if(!is_bad_name(b_name,p_caption,pos) && (search_list[pos].field!=="facebook" ||
                                                     !is_bad_url(b_url,bad_urls,-1)) && !is_bad_site(b_url,b_name,pos))
                {
                    b1_success=true;
		    break;

                }
                
            }
            if(b1_success)
            {
                /* Do shit */
                resolve({url:b_url,pos:pos});
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
        if(my_query.try_count[search_list[pos].field]===0)
        {

            my_query.try_count[search_list[pos].field]++;
            let search_str=my_query.short_name;

            if(search_list[pos].site.length>0 && !/video/.test(search_list[pos].field)) search_str=search_str+" site:"+search_list[pos].site;
            else if(search_list[pos].field==="video") { search_str=search_str+" site:youtube.com"; }
          //  if(!/afsdljlkfsad/.test(search_list[pos].field))
            //{
                query_search(search_str, resolve, reject,query_response,pos);
            //}
            /*else
            {
                	resolve({url:"na",pos:pos});
            }*/
            return;

        }
	resolve({url:"http://na.com/",pos:pos});
//        GM_setValue("returnHit",true);
        return;

    }
    MTurkScript.prototype.parse_FB_videos=function(doc,url,resolve,reject)
    {
        var result={url_list:[]},curr_urls;
        var code=doc.body.getElementsByTagName("code"),i,j,scripts=doc.scripts
        for(i=0; i < code.length; i++)
        {
            //console.log("code ("+i+")");
            code[i].innerHTML=code[i].innerHTML.replace(/^<!-- /,"").replace(/-->$/,"");
        }
        var vid_containers=doc.getElementsByClassName("_5asl");
        for(i=0; i < vid_containers.length; i++)
        {
            if((curr_urls=vid_containers[i].getElementsByTagName("a")).length>0)
            {
                console.log("curr_urls[0].href="+curr_urls[0].href);
                result.url_list.push(MTurkScript.prototype.fix_remote_url(curr_urls[0].href,"https://www.facebook.com"));
            }
        }

        resolve(result);
        //console.timeEnd("fb_about");
    };

    function image_response(response,resolve,reject,pos) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in image_response \n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow, b_caption,p_caption;
        var iusc=doc.getElementsByClassName("iusc");
        var data_field;
        try
        {
            for(i=0; i < iusc.length; i++)
            {
               // console.log("i=("+i+"),"+iusc[i].outerHTML);
                console.log("m="+iusc[i].getAttribute("m"));
                data_field=JSON.parse(iusc[i].getAttribute("m"));
                if(data_field.murl!==undefined && /\.(jpg|png)/.test(data_field.murl)
                  && !is_bad_url(data_field.purl,bad_urls2,-1)



                  )
                {
                    resolve(data_field.murl);
                    return;
                }
            }
        }
        catch(error) { console.log("Error"); }
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,pos,search_URI) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q=';
        if(search_URI!==undefined) search_URIBing=search_URI;
        search_URIBing=search_URIBing+encodeURIComponent(search_str)+"&first=1&rdr=1";
	GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
            onload: function(response) { callback(response, resolve, reject,pos); },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }
            });
    }

    function query_promise_then(result) {
        result.url=result.url.replace(/\/(album|status|releases)\/?.*$/,"").replace(/\/posts\/?.*$/,"");

        ctrl[search_list[result.pos].field].value=result.url;
        my_query.done[search_list[result.pos].field]=true;
        console.log("Done with qpromise_then"+search_list[result.pos].field);

        submit_if_done();
        var search_str="";
        if(search_list[result.pos].field===0 )
        {
            if(result.url!=="http://na.com/")
            {
                search_list.push({site:result.url.replace(/^https?:\/\/www\./,"").replace(/\/$/,"")+"/videos",field:4});

            }
            else
            {
                search_list.push({site:"youtube.com",field:4});
                search_str=my_query.short_name;
            }
            search_str=search_str+" site:"+search_list[search_list.length-1].site;
            console.log("Doing video");
            var url=result.url.replace(/(https:\/\/www\.facebook\.com)\/([^\/]+).*$/,"$1/pg/$2/videos");
            console.log("Video url: "+url);
            var promise2=MTurkScript.prototype.create_promise(url,MTurkScript.prototype.parse_FB_videos,video_promise_then);
            var promise=create_promise(search_str,query_response,query_promise_then,search_list.length-1);
        }

    }

    function video_promise_then(result)
    {
       // console.log("video result="+JSON.stringify(result));
        if(result.url_list.length>0 && (ctrl[4].value.length===0 || ctrl[4].value.indexOf("na.com")!==-1))
        {
            ctrl[4].value=result.url_list[0];
        }
    }

     function image_promise_then(url) {
        ctrl[5].value=url;
        my_query.done["image"]=true;
        console.log("Done with image");
        submit_if_done();

    }

    function submit_if_done()
    {
        var x,na_last=true;
        for(x in my_query.done)
        {
            if(!my_query.done[x]) return false;
        }
        var control=document.getElementsByClassName("form-control"),i;
        for(i=0; i < 5; i++)
        {
            if(control[i].value!=="http://na.com/") na_last=false;
        }
        if(na_last) control[5].value="http://na.com/";
        if(!my_query.submitted)
        {
            my_query.submitted=true;
            check_and_submit(check_function);
        }
    }


    function init_Query()
    {
        //var dont=document.getElementsByClassName("dont-break-out")[0].href;
        var wT=document.getElementById("workContent").getElementsByTagName("table")[0];
        my_query={name:wT.rows[0].cells[1].innerText,done:{video:false,image:false},submitted:false,try_count:{video:0,image:0}};
        my_query.short_name=my_query.name.replace(/^.*?((Live\s[A-Za-z0-9\s]+)|Recital|Clinic|Sessions|Show|Live|Grow Your Art):\s*/,"")
        .replace(/(^|\s)\[[^\]]+\](,|\s|$)/,"")
        
        .replace(/^.+\spresents([\s\.]+)/i,"").replace(/\s+with special guests\s+.*$/i,"").replace(/^.*\s+(with|w\/)\s*/i,"")
        .replace(/\s(and|at|\+|,|[\|\(-\/\"\']+).*$/,"").replace(/:.*$/,"")
        .replace(/\s+ft.\s+.*$/i,"") .replace(/\'s\s+.*$/,"")        .replace(/^.+music of\s*/i,"")
        .replace(/^special guests\s+/i,"")        .replace(/^(DJs|&|and)\s+/,"")
        .replace(/\s*(Duo|Trio|Group|Band)$/i,"").replace(/\s+(Live|Concert|(?:Faculty )?Recital)$/ig,"")
        .replace(/\s&(?:\s+[^\s]+){3,}.*$/,"")
        .replace(/^((?:[A-Za-z]+\s){2,})Plays.*$/i,"$1")




        .trim();
        my_query.short_name=my_query.short_name.replace(/FEATURING.*$/i,"")
        .replace(/^.*?((Live\s[A-Za-z0-9\s]+)|Recital|Clinic|Sessions|Show|Live|Grow Your Art):\s*/,"")
        .replace(/(^|\s)\[[^\]]+\](,|\s|$)/,"")

        .replace(/^.+\spresents([\s\.]+)/i,"").replace(/\s+with special guests\s+.*$/i,"").replace(/^.*\s+(with|w\/)\s*/i,"")
        .replace(/\s(and|at|\+|,|[\|\(-\/\"\']+).*$/,"").replace(/:.*$/,"")
        .replace(/\s+ft.\s+.*$/i,"") .replace(/\'s\s+.*$/,"")        .replace(/^.+music of\s*/i,"")
        .replace(/^special guests\s+/i,"")        .replace(/^(DJs|&|and)\s+/,"")
        .replace(/\s*(Duo|Trio|Group|Band)$/i,"").replace(/\s+(Live|Concert|(?:Faculty )?Recital)$/ig,"")
        .replace(/\s&(?:\s+[^\s]+){3,}.*$/,"")
        .replace(/^((?:[A-Za-z]+\s){2,})Plays.*$/i,"$1")
        .replace(/^sets by/i,"").replace(/^Live Entertainment • /,"")
        .replace(/\s*\'s Senior Recital$/i,"")
        .replace(/\sconducts\s.*$/i,"").replace(/\sin the\s.*$/,"")
        .replace(/^(pianist|violinist)\s/i,"")
        .trim();
        console.log("my_query="+JSON.stringify(my_query));

        my_query.short_name=removeDiacritics(my_query.short_name.replace(/\d+-[^\s]+$/,"").replace(/^the(\s)/i,"").trim());

        while(/\s+[a-z]+$/.test(my_query.short_name)) my_query.short_name=my_query.short_name.replace(/\s+[a-z]+$/,"");
        my_query.short_name=my_query.short_name.trim();



        var i,curr_site;
        var form=document.getElementsByClassName("form-control");
        var search_str;
        var promise_list=[];
        for(i=0; i < form.length; i++) form[i].type="text";
        if(/^Closed(\s|$)/i.test(my_query.short_name))
        {
            for(i=0; i < form.length; i++) form[i].value="http://na.com/";
            check_and_submit(check_function);
            return;
        }

        for(i=0; i < search_list.length; i++)
        {
            my_query.try_count[search_list[i].field]=0;
            my_query.done[search_list[i].field]=false;
        }
        for(i=0;i < search_list.length; i++)
        {
            search_str="\""+my_query.short_name+"\"";
            if(my_query.short_name.split(" ").length<2) search_str="+"+search_str;
            if(search_list[i].field!=="bandcamp") search_str=search_str+" (music OR band)";
            if(search_list[i].site.length>0) search_str=search_str+" site:"+search_list[i].site;

            promise_list.push(create_promise(search_str,query_response,query_promise_then,i));
        }
        const imagePromise=new Promise((resolve, reject) => {

            query_search(my_query.short_name+" (music OR band)", resolve, reject, image_response,-1,"https://www.bing.com/images/search?q=");
        });
        imagePromise.then(image_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this imagePromise, fail message=" + val); GM_setValue("returnHit",true); });

        





    }

    function create_promise(search_str,callback,then_func,pos)
    {
        const queryPromise = new Promise((resolve, reject) => {

            query_search(search_str, resolve, reject, callback,pos);
        });
        queryPromise.then(then_func
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise "+search_str+", fail message=" + val); GM_setValue("returnHit",true); });
    }


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
