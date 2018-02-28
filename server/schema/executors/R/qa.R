#!/usr/bin/env Rscript

# We are calling this script with Rscript serverUploadPath file1 file2 ...
serverUploadPath <- commandArgs(TRUE)[1]
fileList <- commandArgs(TRUE)[-1]

setwd(serverUploadPath)


# Let us save the unique identifier so the Node app can pick up
# files that are generated here as well and move them to the users
# saveFolder
matchLength <- attr(regexpr("\\[.+\\]", text=fileList[1]), "match.length")
prefix <- substr(fileList[1], 1, matchLength)

logFile <- tempfile(pattern=paste(prefix, "logfile-", sep="-"), tmpdir=".", fileext=".log")
errorFile <- tempfile(pattern=paste(prefix, "errors-", sep="-"), tmpdir=".", fileext=".log")

codes <- lapply(fileList, function(x) system2("file", x, stdout=TRUE, stderr=errorFile))
print(codes)

quality <- function( ... ){
	
	file.list <- list.files(fastqFolder, pattern = ".base_dist.txt|.boxplotdata.txt|.length_dist.txt|.phred_dist.txt")
    # if(length(file.list) != 0){
    #     cat("Quality assessment files have been found. If you proceed those files will be overwritten!\n")
    #     choice <- readline("Proceed? (y/n): ")
        
    #     switch(tolower(choice),
    #            y={ cat("Proceeding with quality assessment...\n");
		# 			file.list <- list.files(fastqFolder, pattern = ".faq$|.fq$|.fastq$", full.names=TRUE)
		# 			check <- lapply(file.list, function(x) system(paste("qa ", x)))
    
		# 			if(any(check != 0)){
		# 				cat("The following files returned a non-zero value (this usually indicates an error):\n")
		# 				cat(file.list[which(check != 0)],"\n")
		# 			}
		# 		},
    #            n={ cat("Not creating a new quality assessment.\n"); },
    #            { cat("Input not recognized. Please call quality() again.\n"); return(); })
    # }
    
    output <- "quality-report"
    pdf(paste(output,paste(format(Sys.time(), "%Y-%m-%d"),".pdf",sep=""),sep="-"))
	par(bg="white")
	
	read_base_dist()
	read_length_dist()
	read_phred_dist()
	read_boxplotdata()

	dev.off()
}


read_base_dist <- function(){
	
	file.list <- list.files(path = "./", pattern = "_base_dist.txt", full.names = TRUE)
	
	if(length(file.list) == 0){
		cat("Warning: no _base_dist.txt files have been found!\n")
	}
	else{
		for(file in file.list){
			matrix <- read.delim(file, header = FALSE)
            filename <- unlist(strsplit(file,"_base_dist.txt"))
           	plot(x = 1:nrow(matrix), xlim = c(1,nrow(matrix)), ylim = c(0,100), type = "n", xlab = "Cycle", ylab = "Content [%]", main = paste("Base content per cycle of file\n", filename, sep = ""))
            lines(matrix[,1], col = "red")      # A
            lines(matrix[,2], col = "orange")   # T
            lines(matrix[,3], col = "green")    # G
            lines(matrix[,4], col = "blue")     # C
            lines(matrix[,5], col = 5)          # N
            #lines(matrix[,6], col = 6)          # GC
            grid()
            #legend("topright", legend = c("A","T","G","C","N","GC"), col = c("red","orange","green","blue",5,6), border = "white", lwd = 2)
            legend("topright", legend = c("A","T","G","C","N"), col = c("red","orange","green","blue",5), border = "white", lwd = 2)
		}
	}
}


read_length_dist <- function(){
	
	file.list <- list.files(path = "./", pattern = "_length_dist.txt", full.names = TRUE)

	if(length(file.list) == 0){
		cat("Warning: no _length_dist.txt files have been found!\n")
	}
	else{
		for(file in file.list){		
			distribution <- scan(file)
			
			filename <- unlist(strsplit(file, "_length_dist.txt"))
            #plot(distribution, pch = 20, cex = .5, xlab = "Length", ylab = "# of reads", main = paste("Sequence length distribution of file\n", filename, sep=""))
			
			plot(distribution/sum(distribution)*100, type="h", lwd=5, col=ifelse(distribution > 0 ,"red","white"), 
			xlab = "Length", ylab = "Percentage of reads", main = paste("Sequence length distribution of file\n", filename, sep=""))
			
			#lines(distribution, col = "red", lty = 2)
            grid()
		}
	}
}


read_phred_dist <- function(){
	
	file.list <- list.files(path = "./", pattern = "_phred_dist.txt", full.names = TRUE)

	if(length(file.list) == 0){
		cat("Warning: no _phred_dist.txt files have been found!\n")
	}
	else{
		for(file in file.list){
			distribution <- scan(file)
            
            mat <- matrix(distribution, ncol = 4)

			filename <- unlist(strsplit(file, "_phred_dist.txt"))
            plot(c(0,45),c(0,max(mat)+3), type="n", pch = 20, cex= .5, xlab = "Quality", ylab = "Percentage of bases", main = paste("Quality-per-base distribution of file\n", filename, sep=""))
			lines(x=0:45,mat[1:46,1], col = "red", lty = 2)
            lines(x=0:45,mat[1:46,2], col = "orange", lty = 2)
            lines(x=0:45,mat[1:46,3], col = "green", lty = 2)
            lines(x=0:45,mat[1:46,4], col = "blue", lty = 2)
            
            grid()
            
            legend("topleft", legend = c("A","T","G","C"), col = c("red","orange","green","blue"), border = "white", lwd = 1)
		}
	}
}


read_boxplotdata <- function(){

	file.list <- list.files(path = "./", pattern = "_boxplotdata.txt", full.names = TRUE)

	if(length(file.list) == 0){
		cat("Warning: no _boxplotdata.txt files have been found!\n")
	}
	else{
		for(file in file.list){
            bin2boxplot(file)
		}
	}
}
