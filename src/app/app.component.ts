import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule, NgForm } from '@angular/forms';


interface Produto {
  id?: number;
  nome: string;
  descricao: string;
  preco: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    
    FormsModule
  ],
  template: `
    <!-- Container principal com Tailwind CSS -->
    <div class="bg-gray-100 min-h-screen font-sans text-gray-800">
      <header class="bg-white shadow-md">
        <div class="container mx-auto px-6 py-4">
          <h1 class="text-3xl font-bold text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 inline-block mr-2 -mt-1" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.993.883L4 8v10a1 1 0 00.883.993L5 19h10a1 1 0 00.993-.883L16 18V8a1 1 0 00-.883-.993L15 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4z" clip-rule="evenodd" /></svg>
            Cadastro de Produtos
          </h1>
        </div>
      </header>

      <main class="container mx-auto px-6 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Coluna do Formulário -->
          <div class="lg:col-span-1">
            <div class="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h2 class="text-2xl font-semibold mb-4">{{ isEditing() ? 'Editar Produto' : 'Adicionar Novo Produto' }}</h2>
              
              <form #produtoForm="ngForm" (ngSubmit)="salvarProduto(produtoForm)">
                <input type="hidden" name="id" [(ngModel)]="produtoSelecionado.id">
                
                <div class="mb-4">
                  <label for="nome" class="block text-sm font-medium text-gray-600 mb-1">Nome</label>
                  <input id="nome" name="nome" #nome="ngModel" required [(ngModel)]="produtoSelecionado.nome"
                         class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                         [class.border-red-500]="nome.invalid && nome.touched">
                  <div *ngIf="nome.invalid && nome.touched" class="text-red-500 text-xs mt-1">O nome é obrigatório.</div>
                </div>

                <div class="mb-4">
                  <label for="descricao" class="block text-sm font-medium text-gray-600 mb-1">Descrição</label>
                  <textarea id="descricao" name="descricao" #descricao="ngModel" required [(ngModel)]="produtoSelecionado.descricao"
                            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="3" [class.border-red-500]="descricao.invalid && descricao.touched"></textarea>
                  <div *ngIf="descricao.invalid && descricao.touched" class="text-red-500 text-xs mt-1">A descrição é obrigatória.</div>
                </div>

                <div class="mb-6">
                  <label for="preco" class="block text-sm font-medium text-gray-600 mb-1">Preço</label>
                  <input id="preco" name="preco" type="number" #preco="ngModel" required min="0.01" [(ngModel)]="produtoSelecionado.preco"
                         class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                         [class.border-red-500]="preco.invalid && preco.touched">
                   <div *ngIf="preco.invalid && preco.touched" class="text-red-500 text-xs mt-1">
                      <span *ngIf="preco.errors?.['required']">O preço é obrigatório.</span>
                      <span *ngIf="preco.errors?.['min']">O preço deve ser positivo.</span>
                   </div>
                </div>

                <div class="flex items-center space-x-2">
                   <button type="submit" [disabled]="produtoForm.invalid"
                          class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200">
                     {{ isEditing() ? 'Atualizar' : 'Salvar' }}
                   </button>
                   <button *ngIf="isEditing()" type="button" (click)="cancelarEdicao()"
                          class="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors duration-200">
                     Cancelar
                   </button>
                </div>
              </form>
            </div>
          </div>
          
          <!-- Coluna da Lista de Produtos -->
          <div class="lg:col-span-2">
            <div class="bg-white rounded-lg shadow-lg">
                <div class="p-4 border-b">
                    <h2 class="text-2xl font-semibold">Lista de Produtos</h2>
                </div>
                <div *ngIf="loading()" class="p-6 text-center">
                    <p class="text-gray-500">Carregando produtos...</p>
                </div>
                <div *ngIf="!loading() && produtos().length === 0" class="p-6 text-center">
                    <p class="text-gray-500">Nenhum produto cadastrado ainda.</p>
                </div>
                <div *ngIf="!loading() && produtos().length > 0" class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="p-4 font-semibold">ID</th>
                                <th class="p-4 font-semibold">Nome</th>
                                <th class="p-4 font-semibold">Descrição</th>
                                <th class="p-4 font-semibold">Preço</th>
                                <th class="p-4 font-semibold text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y">
                            <!-- Adicionado 'trackBy' para melhorar a performance e estabilidade da lista -->
                            <tr *ngFor="let produto of produtos(); trackBy: trackById" class="hover:bg-gray-50">
                                <td class="p-4">{{ produto.id }}</td>
                                <td class="p-4 font-medium">{{ produto.nome }}</td>
                                <td class="p-4 text-sm text-gray-600">{{ produto.descricao }}</td>
                                <td class="p-4">{{ produto.preco | currency:'BRL' }}</td>
                                <td class="p-4">
                                    <div class="flex justify-center items-center space-x-2">
                                        <button (click)="selecionarProduto(produto)" class="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 transition-colors duration-200" title="Editar">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg>
                                        </button>
                                        <button (click)="deletarProduto(produto.id!)" class="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors duration-200" title="Deletar">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .ng-invalid.ng-touched {
      border-color: #ef4444;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  private http = inject(HttpClient);

  produtos = signal<Produto[]>([]);
  isEditing = signal(false);
  loading = signal(true);
  produtoSelecionado: Produto = this.getProdutoPadrao();
  
  private readonly apiUrl = 'http://localhost:8080/api/product';

  ngOnInit() {
    this.carregarProdutos();
  }

  
  trackById(index: number, item: Produto): number {
    return item.id!;
  }

  private handleHttpError(error: HttpErrorResponse) {
    if (error.status === 0) {
      console.error('ERRO DE CONEXÃO: Não foi possível conectar à API. Verifique se o backend está rodando e se a configuração de CORS está correta.', error.message);
    } else {
      console.error(`Erro do backend - Código ${error.status}: `, error.error);
    }
  }

  carregarProdutos() {
    this.loading.set(true);
    this.http.get<Produto[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.produtos.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.handleHttpError(err);
        this.loading.set(false);
      }
    });
  }

  selecionarProduto(produto: Produto) {
    this.isEditing.set(true);
    this.produtoSelecionado = { ...produto }; 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  salvarProduto(form: NgForm) {
    if (form.invalid) {
      return;
    }

    const operacao = this.isEditing()
      ? this.http.put<Produto>(`${this.apiUrl}/${this.produtoSelecionado.id}`, this.produtoSelecionado)
      : this.http.post<Produto>(this.apiUrl, this.produtoSelecionado);

    operacao.subscribe({
      next: () => {
        this.carregarProdutos();
        this.cancelarEdicao();
      },
      error: (err) => this.handleHttpError(err)
    });
  }

  deletarProduto(id: number) {
    if(confirm('Tem certeza que deseja excluir este produto?')) {
      this.http.delete<void>(`${this.apiUrl}/${id}`).subscribe({
        next: () => this.carregarProdutos(),
        error: (err) => this.handleHttpError(err)
      });
    }
  }

  cancelarEdicao() {
    this.isEditing.set(false);
    this.produtoSelecionado = this.getProdutoPadrao();
  }

  private getProdutoPadrao(): Produto {
    return { nome: '', descricao: '', preco: 0 };
  }
}

