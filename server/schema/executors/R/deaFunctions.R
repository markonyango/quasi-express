edgeR <- function(){
    
	bool_edger <<- TRUE    
	output <- "edger"
    pdf(paste(output,paste(format(Sys.time(), "%Y-%m-%d"),".pdf",sep=""),sep="-"))
    par(bg="white")
    
    ## create edgeR countData object
    cat("edgeR: Creating edgeR countData object\n")
    dge <<- new("DGEList")
    dge$counts <<- ct
    dge$samples <<- data.frame(group = conds, lib.size = colSums(ct))
    cat("edgeR: Calculating normalization factors\n")
    dge <<- calcNormFactors(dge)
    cat("edgeR: Calculating common dispersion\n")
    dge <<- estimateCommonDisp(dge)
    cat("edgeR: Calculating tagwise dispersion\n")
    dge <<- estimateTagwiseDisp(dge)
    
    ## performing edgeR pairwise differential expression analysis
    cat("edgeR: Testing for differential expression and writing output ( depending on your data this may take a while )\n")
    for(i in pairwise_list){
        res <- unlist(strsplit(i," "))
        string <- paste(paste("edger_",res[1],sep=""), res[2], sep = "")
        
        ## performing exact test to calculate p-values
        cat("edgeR: Performing Exact-Fisher test to calculate p-values (",res[1]," vs ",res[2],")\n")
        assign(string,exactTest(dge, pair = c(res[1],res[2])), envir = globalenv())
        
        assign("edger_com_libsize", dge$common.lib.size, envir = globalenv())
        
        ## how many ids have a p.value below set cutoff
        topX <- sum(p.adjust(get(string)$table$PValue,"BH") < pval) # 07.12.2011 - Use FDR instead of unadjusted p-values
                                                                    # 11.06.2012 - syntax has changed; $p.value -> $PValue
        
        ## save names of ids with p.value below cutoff
        de.tags <- rownames(topTags(get(string), n = topX)$table)
        
        plotDE.edger(dge, de.tags, c(res[1],res[2]), pval)
		
        
        ## generate output files
		cat("edgeR: Annotating the hitlist...\n")
		tmp <- topTags(get(string),n=nrow(get(string)$table))$table
        tmp <- cbind(id=rownames(tmp),tmp)
        tmp <- cbind(tmp,accession=substr(tmp[,1],as.integer(attr(regexpr('([0123456789]+)_',rownames(tmp),ignore.case=TRUE),"match.length"))+1,nchar(rownames(tmp))))
        tmp <- merge(tmp, annotation_db, by = "accession", all.x=TRUE)		
		
		assign(string, tmp, envir = globalenv()) # 01.08.2013 - FDR should obviously be saved with the rest of the results
        
        write.table(tmp,file=paste(string,"_all.txt",sep=""),sep="\t",row.names=FALSE)
        tmp <- tmp[tmp$FDR < .05,]	# 27.07.2012 - syntax has changed; adj.P.Val -> FDR
	    tmp <- tmp[which(!is.na(tmp$id)),]
        write.table(tmp,file=paste(string,".txt",sep=""),sep="\t",row.names=FALSE)
		
    }
    
    dev.off()
    
}


deseq <- function(){
    
	bool_deseq <<- TRUE    
	output <- "deseq"
    pdf(paste(output,paste(format(Sys.time(), "%Y-%m-%d"),".pdf",sep=""),sep="-"))
    par(bg="white")
    
    ## create an DESeq countData object and estimate sizeFactors and dispersion coefficients
    cat("DESeq: Creating DESeq countData object\n")
    cds <<- newCountDataSet(ct, conds)
    cat("DESeq: Calculating normalization factors\n")
    cds <<- estimateSizeFactors(cds)
    
    if(packageVersion("DESeq") < "1.5.1"){
    	cat("DESeq: Calculating variance functions\n")
    	cds <<- estimateVarianceFunctions(cds)
    
    	scvPlot(cds, ylim = c(0,2))
    
    	for(i in conds[duplicated(conds)]){ # 01.08.2013 - Better choice than unique(), because this does not include conditions where there is only one sample
        	residualsEcdfPlot( cds, i )
    	}
    
    	for(i in conds[duplicated(conds)]){ # 01.08.2013 - Better choice than unique(), because this does not include conditions where there is only one sample
        	diag <- varianceFitDiagnostics( cds, i )
        	if(!bool_edger)
                plotdiag(diag, i)
            else
                plotdiag2(diag, i)
    	}
    }
    else{
        cat("DESeq: Warning! You are using a DESeq Version more recent than 1.5.1\n")
        cat("                Skipping deprecated diagnostic plots.\n")
        cat("DESeq: Estimating dispersion coefficients\n")
        tryCatch(
            cds <<- estimateDispersions(cds,fitType="parametric",method="per-condition"),
            warning = function(x){
                cat("DESeq: Couldn't estimate dispersion using fitType = parametric. Switching to local fit!\n")
                cds <<- estimateDispersions(cds,fitType="local",method="per-condition")
            }
        )
        
        for(i in conds[duplicated(conds)]){ # 01.08.2013 - Better choice than unique(), because this does not include conditions where there is only one sample
            plotDispEsts(cds, i)
        }
    }
    
    ## performing DESeq pairwise differential expression analysis
    for(i in pairwise_list){
        res <- unlist(strsplit(i," "))
        string <- paste(paste("deseq_",res[1],sep=""),res[2],sep="")
        
        cat("DESeq: Testing for differential expression of conditions",res[1],"vs",res[2],"and writing output ( depending on your data this may take a while )\n")
        
        ## performing exact test to calculate p-values
        assign(string,nbinomTest(cds,res[1],res[2]),envir = globalenv())
        
        plotDE.deseq( get(string), c(res[1],res[2]), pval )
        
        tmp <- get(string)[order(get(string)$pval),]
        
        cat("DESeq: Annotating the hitlist...\n")
        tmp <- cbind(tmp,accession=substr(tmp[,1],as.integer(attr(regexpr('([0123456789]+)_',tmp[,1],ignore.case=TRUE),"match.length"))+1,nchar(tmp[,1])))
		tmp <- merge(tmp, annotation_db, by = "accession", all.x=TRUE)
        
        assign( string, tmp, envir = globalenv());
        
        #tmp <- na.omit(tmp) ## 02.12.2011 Don't discard ids that have no annotation information
        write.table(tmp,file=paste(string,"_all.txt",sep=""),sep="\t",row.names=FALSE)		
        #tmp <- na.omit(tmp[tmp$padj < .05,]) ## 02.12.2011 Don't discard ids that have no annotation information
        tmp <- tmp[tmp$padj < .05,]
        tmp <- tmp[which(!is.na(tmp$id)),]
        write.table(tmp,file=paste(string,".txt",sep=""),sep="\t",row.names=FALSE)
    }
    
    if(packageVersion("DESeq") < "1.5.1"){
        cdsBlind <- estimateVarianceFunctions( cds, method = "blind" )
    }
    else{
        cdsBlind <- estimateDispersions( cds, method = "blind" )
    }
    
    vsd <- getVarianceStabilizedData( cdsBlind )
    dists <- dist(t(vsd))
    heatmap(as.matrix(dists),symm=TRUE)
    
    dev.off()
    
}

    
bayseq <- function(){

	bool_bayseq <<- TRUE    
	output <- "bayseq"
    pdf(paste(output,paste(format(Sys.time(), "%Y-%m-%d"),".pdf",sep=""),sep="-"))
    par(bg="white")
    
    ## sorting columns of count table and condition vector by condition
    ct <<- ct[,c(order(conds))]
    conds <<- conds[order(conds)]
    
    ## performing BaySeq pairwise differential expression analysis ( this takes way longer! )
    cat("BaySeq: Testing for differential expression and writing output ( this will take very long! )\n")
    cl <- makeCluster(multicore:::detectCores(), "SOCK")
    for(i in pairwise_list){
        res <- unlist(strsplit(i," "))
        string <- paste(paste("bayseq_",res[1],sep=""),res[2],sep="")

        ## choose pair of conditions given in res vector
        ct_bayseq <- counts(cds)[,conditions(cds) %in% res]
        conds_bayseq <- conds[conds %in% res]

        ## baySeq requires the count table to be of matrix type
        ct_bayseq <- as.matrix(ct_bayseq)
        
        ## how many times do the first and second condition occur
        first <- rle(conds_bayseq)[[1]][1]
        second <- rle(conds_bayseq)[[1]][2]
        
        ## create libsizes vector
        libsizes <- getLibsizes(data = ct_bayseq, estimationType="quantile")
        
        ## create replicates
        replicates <- c(rep(1,first),rep(2,second))
        
        ## create groups list
        groups <- list(NDE = c(rep(1,(first+second))),
                        DE = replicates)
        
        ## create baySeq countData object for further analysis
        CD <- new("countData", data = ct_bayseq, replicates = replicates, libsizes = libsizes, groups = groups)
        
        ## Negative Binomial Approach
        obj_cdp.nbml <- paste(string,"CDP.NBML",sep="_")
        obj_cdpost.nbml <- paste(string,"CDPost.NBML",sep="_")
        
        assign(obj_cdp.nbml, getPriors.NB(CD, samplesize = (0.9*initial_number_ids), estimation = "QL", cl = cl),envir=globalenv())
        #assign(obj_cdp.nbml, getPriors.NB(CD, samplesize = (1000), estimation = "QL", cl = NULL),envir=globalenv())
        assign(obj_cdpost.nbml, getLikelihoods.NB(get(obj_cdp.nbml), pET = 'BIC', cl = cl),envir=globalenv())
        
        plotDE.bayseq(get(obj_cdpost.nbml), samplesA = (1:first), samplesB = ((first+1):(first+second)), cond = c(res[1], res[2]), pval)
        
    }
    stopCluster(cl)
    
    dev.off()
    
}


hitOverlap <- function(){
    
	if(!bool_deseq | !bool_edger | !bool_bayseq){
		stop("You must first run all three packages to create the Venn diagram!")
	}    
	output <- "venn"
    pdf(paste(output,paste(format(Sys.time(), "%Y-%m-%d"),".pdf",sep=""),sep="-"))
    par(bg="white")
    
    for(i in pairwise_list){
    
        res <- unlist(strsplit(i," "))
        obj_bayseq <- paste(paste(paste("bayseq_",res[1],sep=""),res[2],sep=""),"_CDPost.NBML",sep="")
        obj_deseq <- paste(paste("deseq_",res[1],sep=""),res[2],sep="")
        obj_edger <- paste(paste("edger_",res[1],sep=""),res[2],sep="")
        
        ## retrieve ids with topCounts and order by id name
        bayseq <- topCounts(get(obj_bayseq), group = 2, number = initial_number_ids)
        bayseq <- bayseq[order(rownames(bayseq)),]
        deseq <- get(obj_deseq)[order(get(obj_deseq)$id),]
        #edger <- get(obj_edger)$table[order(rownames(get(obj_edger)$table)),]
        tmp <- topTags(get(obj_edger),n=nrow(get(obj_edger)$table))$table
        edger <- tmp[order(rownames(tmp)),]
        
        ## bind p.value, pval and FDR column together
        table_both <- cbind(bayseq=bayseq$FDR,deseq=deseq$padj,edger=edger$FDR)
        table_both <- as.data.frame(table_both)
        
        ## determine which id has p.value/FDR/pval less then 5%
        ovl_bayseq <- (table_both$bayseq < pval)
        ovl_deseq <- (table_both$deseq < pval)
        ovl_edger <- (table_both$edger < pval)
        
        ## calculate the overlap of the two hit lists and plot the resulting vennDiagram
        overlap <- cbind(ovl_bayseq,ovl_deseq,ovl_edger)
        a <- vennCounts(overlap)

	## produce overlap list with ids, found by all three packages
	rownames(overlap) <- deseq$id
	all_three <- as.data.frame(names(which(overlap[,1] & overlap[,2] & overlap[,3])),optional=T)
	colnames(all_three) <- "id"
	out <- merge(merge(merge(all_three,deseq,by="id"),edger,by.x="id",by.y="row.names"),bayseq,by.x="id",by.y="row.names")
	out <- out[,c(1,8,12,20,21)]
	colnames(out) <- c("ID","DESeq_FDR","edgeR_FDR","baySeq_Likelihood","baySeq_FDR")
	write.table(out,paste(paste(paste("overlap_",res[1],sep=""),res[2],sep=""),".txt",sep=""),col.names=T,row.names=F,quote=F,sep="\t")
        
        vennDiagram(
            a,
            names = c("BaySeq","DESeq","edgeR"),
            main = paste(paste("Significant IDs predicted by DESeq/BaySeq/edgeR of conditions",res[1],sep=" "),res[2],sep=" ")
        )
    }
    
    dev.off()
    
}