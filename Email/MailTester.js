/** 
 * 
 * Module for finding emails, something to do to trick mailtester eventually I dunno 
 * 
 * Depends on MTurkScript.js
 */

/* EmailQual is an object taking an email address, the url on which it was found, 
 * the_name={fname:John,mname:Quentin,lname:Doe}, desired_domain either undefined or the domain we're looking for emails for */
function EmailQual(email,url,the_name,desired_domain) {
    var fname=the_name.fname.replace(/\'/g,"").toLowerCase(),lname=the_name.lname.replace(/[\'\s]/g,"").toLowerCase();
    var email_regexps=
        [new RegExp("^"+fname.charAt(0)+"(\\.)?"+lname+"$","i"),new RegExp("^"+fname+"[\\._]{1}"+lname+"$","i"),
         new RegExp("^"+fname+lname.charAt(0)+"$","i"),new RegExp("^"+lname+fname.charAt(0)+"$","i")];
    this.email=email;
    this.url=url;
    this.domain=email.replace(/^[^@]*@/,"");
    this.quality=0;
    var email_begin=this.email.replace(/@[^@]*$/,"").toLowerCase();
    if(new RegExp(fname,"i").test(email_begin)) this.quality=1;
    if(new RegExp(lname.substr(0,5),"i").test(email_begin)) {
        this.quality=2;
        if(email_begin.toLowerCase().indexOf(lname.replace(/\'/g,"").toLowerCase())>0 &&
           fname.toLowerCase().charAt(0)===email_begin.toLowerCase().charAt(0)) this.quality=3;
    }
    /* Check if it's bad because wrong names */
    var split=email_begin.split(/[_\.]/);
    for(var i=0;i<email_regexps.length;i++) if(email_regexps[i].test(email_begin)) this.quality=4;
    
    if(desired_domain && this.domain.toLowerCase().indexOf(desired_domain.toLowerCase())!==-1&&this.quality>0) this.quality+=4;
    else if(!desired_domain && this.quality>0) this.quality+=4; /* Added before domain found on query search */
    if(split.length>1) {
        var l_reg=new RegExp(lname,"i"),f_reg=new RegExp(fname,"i");
        if((f_reg.test(split[0]) && !l_reg.test(split[split.length-1])) ||
           (f_reg.test(split[split.length-1]) && !l_reg.test(split[0])) ||
           (!f_reg.test(split[0]) && l_reg.test(split[split.length-1]))||
           (!f_reg.test(split[split.length-1]) && l_reg.test(split[0]))) {
            this.quality=0;
        }
    }
    if(/app\.lead411\.com/.test(this.url)) this.quality=0;
};

/* for sorting EmailQual elements */
EmailQual.email_cmp=function(a,b) {
    try {
        if(a.quality!==b.quality) return b.quality-a.quality;
        else if(a.url<b.url) return -1;
        else if(b.url<a.url) return 1;
        else if(a.email.split("@")[1]<b.email.split("@")[1]) return -1;
        else if(a.email.split("@")[1]>b.email.split("@")[1]) return 1;
        else if(a.email.split("@")[0]<b.email.split("@")[0]) return -1;
        else if(a.email.split("@")[0]>b.email.split("@")[0]) return 1;
        else return 0;
    }
    catch(error) { return 0; }
};


/* the_name is of the format {fname:John,mname:Quentin,lname:Doe} or such, domain is the email domain being attempted,
* resolve and reject should come from a Promise
* will resolve on ITSELF as the parameter, so the caller can do whatever with the information therein 
* resolve_early is an indicator variable for if we should resolve as soon as a good enough email is found
*
* Program logic: we do another do_next_email_query after resolving a Promise where we search for the email using Bing
*
*
*
*/
function MailTester(the_name,domain,resolve,reject,resolve_early,mailtester_callback) {
    this.fullname=the_name;
    this.lname=the_name.lname.replace(/[\'\s]/g,"").toLowerCase();
    this.fname=the_name.fname.replace(/\'/g,"").toLowerCase();
    this.minit=the_name.mname&&the_name.mname.length>0?the_name.mname.toLowerCase().charAt(0):"";

    Object.assign(this,{resolve:resolve,reject:reject,mailtester_callback,mailtester_callback,domain:domain,
			totalEmail:0,doneEmail:0,found_good:false,resolve_early:resolve_early||false,email_list:[]});
    this.email_types=[this.fname.charAt(0)+this.lname+"@"+this.domain,
                          this.fname+"."+this.lname+"@"+this.domain,
                          this.lname+"."+this.fname+"@"+this.domain,
                         this.fname+"_"+this.lname+"@"+this.domain,
                         this.fname+this.lname+"@"+this.domain,
                         this.lname+this.fname.charAt(0)+"@"+this.domain,
                         this.fname+this.lname.charAt(0)+"@"+this.domain,
                         this.lname+"@"+this.domain,
                              this.fname+"@"+this.domain,
                              this.fname+"."+this.minit+"."+this.lname+"@"+this.domain
                     ];
    this.curr_mailtester_num=0; // current mailtester query being done
    // Indicator variable if we either confirmed an email successfully or can't confirm with this domain
    this.done_with_mailtester=false;     
    this.do_next_email_query();
};

MailTester.email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%\*]{1,40}(\.[^<>\/()\[\]\\.,;:：\s\*@"\?]{1,40}){0,5}))@((([a-zA-Z\-0-9]{1,30}\.){1,8}[a-zA-Z]{2,20}))/g;

MailTester.bad_urls=["facebook.com","youtube.com","twitter.com","instagram.com","opendi.us",".business.site","plus.google.com",
		     ".alibaba.com",".trystuff.com",".mturkcontent.com",".amazonaws.com",".medium.com",".google.com",
		     ".opencorporates.com",".thefreedictionary.com",".dictionary.com",".crunchbase.com",
		     
		     "beenverified.com","downloademail.info","email-format.com",".facebook.com",".niche.com","en.wikipedia.org",
		     "hunter.io","issuu.com","/app.lead411.com","linkedin.com",".lead411.com",
                     ".privateschoolreview.com","scribd.com","/lusha.co","patents.justia.com",".skymem.com",
		     "/ufind.name",".yelp.com",".zoominfo.com"];

/* Do the next email query for the current position in email_types */
MailTester.prototype.do_next_email_query=function(self) {
    var search_str, emailPromise;
    if(!self) self=this;
//    var self=this;
    console.log("do_next_email, query,curr_query_num="+this.curr_mailtester_num);
    self.email_list.sort(EmailQual.email_cmp);
    if(self.curr_mailtester_num<self.email_types.length) {
        let curr_email=self.email_types[self.curr_mailtester_num];
        self.curr_mailtester_num++;
        search_str="+\""+curr_email+"\"";
	// Don't do mailtester queries if we've found one already 
        if(!self.done_with_mailtester && (self.email_list.length===0 || self.email_list[0].quality<6)) {
	    self.do_mailtester_query(curr_email,self); }
	
        // Leaving out search initially???
	else if(self.resolve_early&&self.email_list.length>0 && self.email_list[0].quality>=6) {
	    self.resolve(self.email_list);
	    return;
	}
	// after emailPromise resolves, do more queries
	emailPromise = new Promise((email_resolve,email_reject) => {
            MTurkScript.prototype.query_search(search_str,email_resolve,email_reject,self.query_response,"email");
	});
	emailPromise.then(function() { self.do_next_email_query(self) })
	    .catch(function() { self.do_next_email_query(self) });

	// don't resolve yet if we're not done
	return;
    }
	// If we've found a good email, we can resolve early
    this.email_list.sort(EmailQual.email_cmp);
    this.resolve(this.email_list);
};
   
/* do a query of mailtester.com */
MailTester.prototype.do_mailtester_query=function(email,self) {

    var url="http://mailtester.com/testmail.php";
    var data={"lang":"en","email":email};
    var headers={"host":"mailtester.com","origin":"http://mailtester.com","Content-Type": "application/x-www-form-urlencoded",
                 "referer":"http://mailtester.com/testmail.php"};
    var data_str=MTurkScript.prototype.json_to_post(data);
    console.log("do_mailtester_query, email="+email+", data_str="+data_str);
    if(!self) self=this;
    var promise=new Promise((resolve,reject) => {
        if(self.done_with_mailtester) return;
        GM_xmlhttpRequest({method: 'POST', headers:headers,data:data_str,anonymous:true,
                           url: url,
                           onload: function(response) {
                               var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                               self.mailtester_response(doc,response.finalUrl, resolve, reject,email,self);
                           },
                           onerror: function(response) { reject("Fail mailtester"); },ontimeout: function(response) { reject("Fail"); }
                          });
    });
    promise.then(function() {
	if(typeof self.mailtester_callback === 'function') self.mailtester_callback();
    }).catch(function() {
        if(typeof self.mailtester_callback === 'function') self.mailtester_callback();
    });
};

/* response to a mailtester query */
MailTester.prototype.mailtester_response=function(doc,url,resolve,reject,email,self) {
    if(!self) self=this;

    console.log("mailtester_response,doc.body.innerHTML.length="+doc.body.innerHTML.length);
    var table=doc.querySelector("#content > table");
    if(table) {
        let lastRow=table.rows[table.rows.length-1];
        let lastCell=lastRow.cells[lastRow.cells.length-1];
        let cellText=lastCell.innerText;
        console.log("email="+email+", lastCell="+lastCell.innerHTML);
        if(cellText.indexOf("E-mail address is valid")!==-1||
           cellText.indexOf("The user you are trying to contact is receiving mail at a rate that")!==-1) {
            this.email_list.push(new EmailQual(email,url,this.fullname,this.domain));
            this.done_with_mailtester=true;
        }
        else if(cellText.indexOf("Server doesn\'t allow e-mail address verification")!==-1||
                cellText.indexOf("Internal resource temporarily unavailable")!==-1||cellText.indexOf("Connection refused")!==-1||
                cellText.indexOf("The domain is invalid or no mail server was found for it")!==-1) {
            // Don't waste precious queries
            console.log("Setting found_with_mailtester due to not allowed");
            this.done_with_mailtester=true;
        }

    }
    else {
        console.log("doc.body.innerHTML="+doc.body.innerHTML);
    }
    resolve("");
};

/* Query response specifically for finding emails */
MailTester.prototype.query_response=function(response,resolve,reject,type) {
    var doc = new DOMParser().parseFromString(response.responseText, "text/html");
    console.log("in query_response\n"+response.finalUrl+", type="+type);
    var search, b_algo, i=0;
    var b_url, b_name, b_factrow, b_caption,p_caption,loop_result,b1_success=false;
    var promise_list=[];
    try {
        search=doc.getElementById("b_content");
        b_algo=search.getElementsByClassName("b_algo");
        for(i=0; i < b_algo.length&&i<=3; i++) {
            b_url=this.query_response_loop(b_algo,i,type,promise_list,resolve,reject,b1_success);
            if(b_url&&(b1_success=true)) break;
        }
        if(type==="email") {
            this.totalEmail++;
            Promise.all(promise_list).then(function() {
		console.log("Done with "+response.finalUrl);
                this.doneEmail++;
		resolve("");
                 })
                .catch(function() {
		    console.log("Done with "+response.finalUrl);

                    this.doneEmail++;
                    resolve(""); });
            return;
	}
    }
    catch(error) {
        reject(error);
        return;
    }
    
    reject("Nothing found");
    return;
};

/* Parse a single bing search result on a page */
MailTester.prototype.query_response_loop=function(b_algo,i,type,promise_list,resolve,reject,b1_success) {
    var b_name,b_url,p_caption,b_caption;
    var mtch,j,people;
    b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
    b_url=b_algo[i].getElementsByTagName("a")[0].href;
    b_caption=b_algo[i].getElementsByClassName("b_caption");
    p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
        p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';

   
    if(/(email|query)/.test(type) && (mtch=p_caption.match(MailTester.email_re))) {
        for(j=0; j < mtch.length; j++) {
	    if(!MTurkScript.prototype.is_bad_email(mtch[j]) &&
	       mtch[j].length>0) this.email_list.push(new EmailQual(mtch[j],b_url,this.fullname,this.domain));
	}
    }
    /* TODO: integrate PDF parser at some point */
    if(type==="email" && i <=3 && !/\.(xls|xlsx|pdf|doc)$/.test(b_url)&&
       !MTurkScript.prototype.is_bad_url(b_url,MailTester.bad_urls,-1)) {
        promise_list.push(MTurkScript.prototype.create_promise(
	    b_url,this.contact_response,MTurkScript.prototype.my_then_func,MTurkScript.prototype.my_catch_func));
    }
    return null;
};

/**
     * contact_response Here it searches for an email TODO:FIX */
MailTester.prototype.contact_response=function(doc,url,resolve,reject,query) {
    console.log("in contact_response,url="+url);
    var i,j,temp_email,links=doc.links,email_matches;
    var temp_url,curr_url;
    doc.body.innerHTML=doc.body.innerHTML.replace(/\s*([\[\(]{1})\s*at\s*([\)\]]{1})\s*/,"@")
        .replace(/\s*([\[\(]{1})\s*dot\s*([\)\]]{1})\s*/,".").replace(/dotcom/,".com");
    MTurkScript.prototype.fix_emails(doc,url);
    if((email_matches=doc.body.innerHTML.match(MailTester.email_re))) {
        for(j=0; j < email_matches.length; j++) {
            if(!MTurkScript.prototype.is_bad_email(email_matches[j]) &&
	       email_matches[j].length>0) this.email_list.push(new EmailQual(email_matches[j].toString(),url,this.fullname,this.domain));
        }
    }
    for(i=0; i < links.length; i++) {
        try {
            if((temp_email=links[i].href.replace(/^mailto:\s*/,"").match(MailTester.email_re)) &&
               !MTurkScript.prototype.is_bad_email(temp_email[0])) this.email_list.push(new EmailQual(temp_email.toString(),url,this.fullname,this.domain));
        }
        catch(error) { console.log("Error with emails "+error); }
    }
    console.log("* doing doneQueries++ for "+url);
    resolve("");
    return;
};
