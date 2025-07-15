import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from 'generated/prisma';
import { PaginatorDto } from 'src/common';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(ProductsService.name);

  onModuleInit() {
    this.$connect();
    this.logger.log('Connected to database');
  }

  create(createProductDto: CreateProductDto) {
    return this.product.create({
      data: createProductDto
    })
  }

  async findAll(paginatorDto: PaginatorDto) {
    var { page, limit } = paginatorDto;

    if (!page) page = 1;
    if (!limit) limit = 10;

    const skip = (page - 1) * limit;
    const take = limit;

    const totalPage = await this.product.count({ where: { available: true } });
    const lastPage = Math.ceil(totalPage / limit);

    return {
      data: await this.product.findMany({
        skip,
        take,
        where: { available: true }
      }),
      meta: {
        page,
        totalPage,
        lastPage,
      },
    }
  }

  async findOne(id: number) {
    const product = await this.product.findUnique({
      where: { id, available: true }
    })

    if (!product) {
      throw new RpcException(`Product with id #${id} not found`);
    }

    return product;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    if (!id) {
      throw new NotFoundException(`Id not found`);
    }

    if (!updateProductDto) {
      throw new NotFoundException(`Update product dto not found`);
    }

    const {id: __, ...data} = updateProductDto;

    try {
      return this.product.update({
        where: { id },
        data: data
      })
    } catch (error) {
      throw new NotFoundException(`Product with id #${id} not found`);
    }
  }

  async remove(id: number) {
    try {
      await this.findOne(id);

      return this.product.update({
        where: { id },
        data: { available: false }
      })
    } catch (error) {
      throw new NotFoundException(`Product with id #${id} not found`);
    }
  }
}
