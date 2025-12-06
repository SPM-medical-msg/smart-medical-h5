import echarts from 'echarts'

export const scoreSta = (data) =>{
    return {
        backgroundColor: '#00265f',
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        legend: {
            data: ['最高分', '平均分', '最低分'],
            align: 'right',
            right: 10,
            textStyle: {
                color: "#fff"
            },
            itemWidth: 10,
            itemHeight: 10,
            itemGap: 35
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: [{
            type: 'category',
            data: data.xList,
            axisLine: {
                show: true,
                lineStyle: {
                    color: "#063374",
                    width: 1,
                    type: "solid"
                }
            },
            axisTick: {
                show: false,
            },
            axisLabel: {
                show: true,
                textStyle: {
                    color: "#00c7ff",
                }
            },
        }],
        yAxis: [{
            type: 'value',
            axisLabel: {
                formatter: '{value}'
            },
            axisTick: {
                show: false,
            },
            axisLine: {
                show: false,
                lineStyle: {
                    color: "#00c7ff",
                    width: 1,
                    type: "solid"
                },
            },
            splitLine: {
                lineStyle: {
                    color: "#063374",
                }
            }
        }],
        series: [{
            name: '最高分',
            type: 'bar',
            data: data.maxList,
            barWidth: 20, //柱子宽度
            barGap: 1, //柱子之间间距
            label: {
                show: true, // 显示数值
                color:'white',
                position: 'top' // 数值显示的位置
            },
            itemStyle: {
                normal: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                        offset: 0,
                        color: '#008cff'
                    }, {
                        offset: 1,
                        color: '#005193'
                    }]),
                    opacity: 1,
                },

            }
        }, {
            name: '平均分',
            type: 'bar',
            data: data.avgList,
            barWidth: 20,
            barGap: 1,
            itemStyle: {
                normal: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                        offset: 0,
                        color: '#00da9c'
                    }, {
                        offset: 1,
                        color: '#007a55'
                    }]),
                    opacity: 1,
                }
            },
            label: {
                show: true, // 显示数值
                color:'white',
                position: 'top' // 数值显示的位置
            }
        }, {
            name: '最低分',
            type: 'bar',
            data: data.minList,
            barWidth: 20,
            barGap: 1,
            label: {
                show: true, // 显示数值
                color:'white',
                position: 'top' // 数值显示的位置
            },
            itemStyle: {
                normal: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                        offset: 0,
                        color: '#c4e300'
                    }, {
                        offset: 1,
                        color: '#728400'
                    }]),
                    opacity: 1,
                }
            }
        }]
    };
}