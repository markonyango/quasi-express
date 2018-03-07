#!/usr/bin/env Rscript

# We need the plot.R module for result drawing
source('./server/schema/executors/R/plot.R')

# We are calling this script with Rscript projectPath file1 file2 ...
projectPath <- commandArgs(TRUE)[1] # This is where the projects output will be written to
filePath <- file.path(projectPath, '..') # Files are stored one level above of the project folder itself for sharing purposes
fileList <- unlist(strsplit(commandArgs(TRUE)[-1],","))
print(fileList)
print(commandArgs())

# Set the working directory to the users savePath. Much easier to work with relative paths
setwd(projectPath)

logFile <- 'logfile.txt'
errorFile <- 'error.txt'

# Collect status return codes from each qa function call
codes <- sapply(fileList, function(x) system2("qa", file.path(filePath, x), stdout=logFile, stderr=errorFile), USE.NAMES = FALSE)

# If any of the return values was not 0 (i.e. error) get the first non-0 code and
# exit the script with that error code
if(any(codes != 0)) {
	firstCode <- which(codes != 0)
	quit(status=codes[firstCode])
}

read_base_dist <- function(){
	
	file.list <- list.files(path = "./", pattern = "base_dist.txt", full.names = TRUE)
	
	if(length(file.list) == 0){
		cat("Warning: no _base_dist.txt files have been found!\n")
	}
	else{
		for(file in file.list){
			matrix <- read.delim(file, header = FALSE)
            filename <- unlist(strsplit(file,"base_dist.txt"))
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
	
	file.list <- list.files(path = "./", pattern = "length_dist.txt", full.names = TRUE)

	if(length(file.list) == 0){
		cat("Warning: no _length_dist.txt files have been found!\n")
	}
	else{
		for(file in file.list){		
			distribution <- scan(file)
			
			filename <- unlist(strsplit(file, "length_dist.txt"))
            #plot(distribution, pch = 20, cex = .5, xlab = "Length", ylab = "# of reads", main = paste("Sequence length distribution of file\n", filename, sep=""))
			
			plot(distribution/sum(distribution)*100, type="h", lwd=5, col=ifelse(distribution > 0 ,"red","white"), 
			xlab = "Length", ylab = "Percentage of reads", main = paste("Sequence length distribution of file\n", filename, sep=""))
			
			#lines(distribution, col = "red", lty = 2)
            grid()
		}
	}
}


read_phred_dist <- function(){
	
	file.list <- list.files(path = "./", pattern = "phred_dist.txt", full.names = TRUE)

	if(length(file.list) == 0){
		cat("Warning: no phred_dist.txt files have been found!\n")
	}
	else{
		for(file in file.list){
			distribution <- scan(file)
            
            mat <- matrix(distribution, ncol = 4)

			filename <- unlist(strsplit(file, "phred_dist.txt"))
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

	file.list <- list.files(path = "./", pattern = "boxplotdata.txt", full.names = TRUE)

	if(length(file.list) == 0){
		cat("Warning: no boxplotdata.txt files have been found!\n")
	}
	else{
		for(file in file.list){
            bin2boxplot(file)
		}
	}
}


pdf("quality-report.pdf")
par(bg="white")
	
read_base_dist()
read_length_dist()
read_phred_dist()
read_boxplotdata()

dev.off()